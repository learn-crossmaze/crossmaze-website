import { useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Icon } from './fields';
import { SITE_URL, errorText, formatDate, useSession, useToast } from './ui';

/**
 * "Ask for a draft" on the Blog page (full admins): the admin writes what a post should be about, and the school's
 * Claude task writes it as a hidden draft (functions/lib/blogRequest.js). The latest requests are listed below the
 * box with where each one stands; a finished draft also arrives by email with its preview (lib/review.js).
 */
interface DraftRequest {
  id: string;
  concept: string;
  requestedBy?: string;
  createdAt?: { toDate(): Date };
  readyAt?: { toDate(): Date };
  status: 'writing' | 'ready' | 'failed';
  slug?: string;
  previewKey?: string;
}

// Keep in step with functions/lib/blogRequest.js.
const MIN = 20;
const MAX = 1500;
/** A request still "writing" after this long has probably stopped. */
const LATE_MS = 2 * 60 * 60 * 1000;
/** The website is rebuilt after a draft is marked ready, so its preview opens a few minutes later. */
const BUILD_MS = 10 * 60 * 1000;
/** Requests count towards the day's limit for this long, and can't be cleared from the list until then. */
const DAY_MS = 24 * 60 * 60 * 1000;
const NOT_SET_UP = 'Asking for drafts is not switched on yet. Whoever looks after the website can set it up (README, “Ask for a draft”).';

export function DraftRequests() {
  const { services } = useSession();
  const toast = useToast();
  const [requests, setRequests] = useState<DraftRequest[]>([]);
  // The list can't be read until the feature's rules are deployed, with its function: until then, say so.
  const [ready, setReady] = useState<boolean>();
  const [concept, setConcept] = useState('');
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  // "Late" and "just ready" depend on the clock, so look again every minute.
  const [now, setNow] = useState(Date.now());

  useEffect(
    () =>
      onSnapshot(
        query(collection(services.db, 'blogRequests'), orderBy('createdAt', 'desc'), limit(8)),
        (snap) => {
          setRequests(snap.docs.map((d) => ({ ...(d.data() as Omit<DraftRequest, 'id'>), id: d.id })));
          setReady(true);
        },
        () => setReady(false),
      ),
    [services.db],
  );
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const length = concept.trim().length;
  const send = async () => {
    setBusy(true);
    try {
      await httpsCallable<{ concept: string }, { ok: boolean }>(services.functions, 'requestDraft')({ concept });
      setConcept('');
      toast('ok', 'Asked. The draft arrives by email and in the list below in about an hour.');
    } catch (e) {
      const code = (e as { code?: string }).code;
      // The function isn't deployed yet (the browser only sees a failed request).
      toast('error', code === 'functions/internal' || code === 'functions/not-found' ? NOT_SET_UP : errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const reuse = (words: string) => {
    if (concept.trim() && concept.trim() !== words && !confirm('Replace what you have written in the box?')) return;
    setConcept(words);
    box.current?.focus();
    box.current?.scrollIntoView({ block: 'center' });
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
      {ready === false ? (
        <p className="help">{NOT_SET_UP}</p>
      ) : (
        <>
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
                  <b>School facts to include</b>, such as an event’s name, date and centre, and what the children did. The post uses only the facts
                  you type here and what the website already says, so please check them: they are treated as correct.
                </li>
                <li>
                  <b>The style</b>, if you have one in mind: “5 tips”, “a short notice”, “a letter to parents”.
                </li>
              </ul>
              <p>
                <b>Leave out</b> children’s and parents’ names and anything private. Fees and offers are left out of drafts: write those as a notice
                yourself.
              </p>
              <p>
                <b>An example</b>
              </p>
              <p className="draft-requests__example">
                Topic: helping children settle after a long break.
                <br />
                For: parents of Play Group and Nursery children.
                <br />
                Cover: why the first week back can be wobbly, a calm morning routine, a short goodbye, how teachers help.
                <br />
                School facts: our centres reopen on [your date].
                <br />
                Style: 5 simple tips.
              </p>
              <p>
                <b>What happens next</b>
              </p>
              <ul>
                <li>
                  The draft takes about an hour. Every admin then gets an email with a preview and a “Review and publish” button (when Email alerts are
                  set up under Connections).
                </li>
                <li>It also appears in the list below as a hidden post, where you can edit the words before publishing.</li>
                <li>Its photos are free stock pictures as placeholders. Replace them with your own before or after publishing.</li>
                <li>One draft is written at a time, and the school can ask for five a day.</li>
                <li>Not what you wanted? Edit it, or delete it and ask again with clearer words.</li>
              </ul>
            </div>
          </details>
          <div className="field">
            <label htmlFor="draft-concept">What should the post be about?</label>
            <textarea
              id="draft-concept"
              ref={box}
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
          <button type="button" className="btn" disabled={busy || ready !== true || length < MIN || length > MAX} onClick={send}>
            <Icon name="Pencil" /> {busy ? 'Asking…' : 'Write a draft'}
          </button>
        </>
      )}

      {requests.length > 0 && (
        <ul className="draft-requests__list">
          {requests.map((r) => {
            const at = r.createdAt?.toDate();
            const age = at ? now - at.getTime() : 0;
            const late = r.status === 'writing' && age > LATE_MS;
            const justReady = r.status === 'ready' && now - (r.readyAt?.toDate().getTime() ?? 0) < BUILD_MS;
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
                  {justReady && ' Its preview opens a few minutes after it turns ready.'}
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
                  {ready !== false && (
                    <button type="button" className="btn btn-light btn-sm" onClick={() => reuse(r.concept)}>
                      Use these words again
                    </button>
                  )}
                  {/* Requests that still count towards today's five stay (the rules refuse removing them). */}
                  {(r.status === 'failed' || age > DAY_MS) && (
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
