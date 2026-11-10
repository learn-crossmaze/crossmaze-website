import { useEffect, useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useCollection } from '../data';
import { Icon } from './fields';
import { SITE_URL, errorText, formatDate, useSession, useToast } from './ui';

/**
 * "Ask for a draft" on the Blog page (full admins): the admin writes what a post should be about, and the school's
 * Claude task writes it as a hidden draft (functions/lib/blogRequest.js). The requests of the last weeks are listed
 * below the box with where each one stands; a finished draft also arrives by email with its preview (lib/review.js).
 */
interface DraftRequest {
  concept: string;
  requestedBy?: string;
  createdAt?: { toDate(): Date };
  status: 'writing' | 'ready' | 'failed';
  slug?: string;
  previewKey?: string;
  sessionUrl?: string;
}

// Keep in step with functions/lib/blogRequest.js.
const MIN = 20;
const MAX = 1500;
/** A request still "writing" after this long has probably stopped. */
const LATE_MS = 2 * 60 * 60 * 1000;

const EXAMPLE =
  'Topic: helping children settle after the winter break.\nFor: parents of Play Group and Nursery children.\nCover: why the first week back can be wobbly, a calm morning routine, a short goodbye, what teachers do to help.\nSchool facts: our centres reopen on 2 January.\nStyle: 5 simple tips.';

export function DraftRequests() {
  const { services } = useSession();
  const toast = useToast();
  const { items } = useCollection<DraftRequest>(services.db, 'blogRequests');
  const [concept, setConcept] = useState('');
  const [busy, setBusy] = useState(false);
  // "Late" depends on the clock, so look again every minute while something is being written.
  const [now, setNow] = useState(Date.now());
  const requests = [...items].sort((a, b) => (b.createdAt?.toDate().getTime() ?? Infinity) - (a.createdAt?.toDate().getTime() ?? Infinity)).slice(0, 8);
  const writing = requests.some((r) => r.status === 'writing' && now - (r.createdAt?.toDate().getTime() ?? now) < LATE_MS);
  useEffect(() => {
    if (!writing) return;
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [writing]);

  const length = concept.trim().length;
  const send = async () => {
    setBusy(true);
    try {
      await httpsCallable<{ concept: string }, { ok: boolean }>(services.functions, 'requestDraft')({ concept });
      setConcept('');
      toast('ok', 'Asked. The draft arrives by email and in the list below in about an hour.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(services.db, 'blogRequests', id));
    } catch (e) {
      toast('error', errorText(e));
    }
  };

  return (
    <section className="card draft-requests" aria-labelledby="draft-requests-title">
      <h2 id="draft-requests-title">
        <Icon name="Sparkles" size={18} /> Ask for a draft
      </h2>
      <p className="help">
        Write what the post should be about and Claude writes it for you as a hidden draft. Nothing reaches the website until you publish it.
      </p>
      <details className="draft-requests__guide">
        <summary>What to write, and what to expect</summary>
        <div>
          <p>
            <b>What to write</b> (a few lines are enough):
          </p>
          <ul>
            <li>
              <b>The topic, and who it is for.</b> “Toilet training tips for parents of 2 to 3-year-olds.”
            </li>
            <li>
              <b>The points to cover.</b> Three to five is plenty.
            </li>
            <li>
              <b>School facts to include</b>, such as an event’s name, date and centre, and what the children did. The post uses only the facts you
              type here and what the website already says, so please check them: they are treated as correct.
            </li>
            <li>
              <b>The style</b>, if you have one in mind: “5 tips”, “a short notice”, “a letter to parents”.
            </li>
          </ul>
          <p>
            <b>Leave out</b> children’s and parents’ names and anything private. Fees and offers are better as a notice you write yourself.
          </p>
          <p>
            <b>What happens next</b>
          </p>
          <ul>
            <li>The draft takes about an hour. Every admin then gets an email with a preview and a “Review and publish” button.</li>
            <li>It also appears in the list below as a hidden post, where you can edit the words before publishing.</li>
            <li>Its photos are free stock pictures as placeholders. Replace them with your own before or after publishing.</li>
            <li>One draft is written at a time, and the school can ask for five a day.</li>
            <li>Not what you wanted? Edit it, or delete it and ask again with clearer words.</li>
          </ul>
          <p>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setConcept(EXAMPLE)}>
              Show me an example
            </button>
          </p>
        </div>
      </details>
      <div className="field">
        <label htmlFor="draft-concept">What should the post be about?</label>
        <textarea
          id="draft-concept"
          rows={5}
          maxLength={MAX}
          value={concept}
          placeholder="The topic, who it is for, the points to cover, and any school facts to include."
          onChange={(e) => setConcept(e.target.value)}
        />
        <p className={`help ${length > MAX - 100 ? 'length--over' : ''}`}>
          {length} of {MAX} characters{length > 0 && length < MIN ? ` (at least ${MIN})` : ''}
        </p>
      </div>
      <button type="button" className="btn" disabled={busy || length < MIN || length > MAX} onClick={send}>
        <Icon name="Pencil" /> {busy ? 'Asking…' : 'Write a draft'}
      </button>

      {requests.length > 0 && (
        <ul className="draft-requests__list">
          {requests.map((r) => {
            const at = r.createdAt?.toDate();
            const late = r.status === 'writing' && at !== undefined && now - at.getTime() > LATE_MS;
            return (
              <li key={r.id}>
                <p className="draft-requests__concept">{r.concept}</p>
                <p className="help">
                  {r.status === 'ready' ? (
                    <span className="chip chip-sent">Ready</span>
                  ) : r.status === 'failed' ? (
                    <span className="chip chip-failed">Not started</span>
                  ) : late ? (
                    <span className="chip chip-failed">Taking too long</span>
                  ) : (
                    <span className="chip chip-pending">Being written</span>
                  )}{' '}
                  Asked {formatDate(at)}
                  {r.requestedBy ? ` by ${r.requestedBy}` : ''}.
                  {r.status === 'failed' && ' The writer could not be started; please ask again.'}
                  {late && ' Something may have gone wrong. Ask again, or tell whoever looks after the website.'}
                </p>
                <p className="draft-requests__actions">
                  {r.status === 'ready' && r.slug && (
                    <a className="btn btn-sm" href={`#/posts/${r.slug}`}>
                      Open the draft
                    </a>
                  )}
                  {r.status === 'ready' && r.previewKey && (
                    <a className="btn btn-light btn-sm" href={`${SITE_URL}/blog/preview/${r.previewKey}`} target="_blank" rel="noopener noreferrer">
                      Preview
                    </a>
                  )}
                  {r.status === 'writing' && r.sessionUrl && (
                    <a className="btn btn-light btn-sm" href={r.sessionUrl} target="_blank" rel="noopener noreferrer" title="Opens for the owner of the school’s Claude account">
                      Watch it being written
                    </a>
                  )}
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setConcept(r.concept)}>
                    Use these words again
                  </button>
                  {(r.status !== 'writing' || late) && (
                    <button type="button" className="btn btn-light btn-sm" onClick={() => remove(r.id)}>
                      Remove from this list
                    </button>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
