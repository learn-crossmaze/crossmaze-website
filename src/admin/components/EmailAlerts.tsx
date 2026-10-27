import { useEffect, useState } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { same, useDoc } from '../data';
import { Icon } from './fields';
import { ErrorBox, PageHeader, Spinner, errorText, useSession, useToast } from './ui';

/** ZeptoMail settings for the emails to admins (functions/lib/zeptomail.js reads the same document). */
interface EmailConfig {
  enabled: boolean;
  url: string;
  token: string;
  fromAddress: string;
  fromName: string;
}

const EMPTY: EmailConfig = { enabled: false, url: 'https://api.zeptomail.com/v1.1/email', token: '', fromAddress: '', fromName: 'Crossmaze website' };

// ZeptoMail's API address for each data centre (keep in step with isZeptoUrl in functions/lib/zeptomail.js).
const ZEPTO_URL = /^https:\/\/api\.zeptomail\.(com|in|eu|com\.au|jp|ca|sa|com\.cn)\//;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailAlertsPage() {
  const { services } = useSession();
  const toast = useToast();
  const { data, loading, error } = useDoc<EmailConfig>(services.db, 'private/zeptomail');
  const [draft, setDraft] = useState<EmailConfig>(EMPTY);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const [test, setTest] = useState<{ status: string; httpStatus?: number; error?: string }>();
  const [admins, setAdmins] = useState<string[]>();
  const saved = { ...EMPTY, ...data };
  const dirty = !same(draft, saved);

  useEffect(() => {
    if (!loading) setDraft({ ...EMPTY, ...data });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Who the alerts go to: the full admins (Admins page).
  useEffect(() => {
    getDocs(collection(services.db, 'admins'))
      .then((snap) => setAdmins(snap.docs.map((d) => d.id).sort()))
      .catch(() => setAdmins([]));
  }, [services.db]);

  const save = async () => {
    if (draft.enabled) {
      if (!ZEPTO_URL.test(draft.url)) return toast('error', 'The API address must be a ZeptoMail one, such as https://api.zeptomail.com/v1.1/email');
      if (!draft.token.trim()) return toast('error', 'Paste the Send Mail token from ZeptoMail.');
      if (!EMAIL.test(draft.fromAddress)) return toast('error', 'Enter the From address, e.g. noreply@crossmaze.in');
    }
    setBusy('save');
    try {
      await setDoc(doc(services.db, 'private/zeptomail'), { ...draft, token: draft.token.trim() });
      toast('ok', draft.enabled ? 'Saved. Admins will get an email if a submission can’t be sent to LITMUS.' : 'Saved. Email alerts are switched off.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const runTest = async () => {
    setBusy('test');
    setTest(undefined);
    try {
      const fn = httpsCallable<void, typeof test>(services.functions, 'testEmailAlert');
      setTest((await fn()).data);
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusy(null);
    }
  };

  if (error) return <ErrorBox>{errorText(error)}</ErrorBox>;
  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Email alerts"
        intro="The website thanks visitors as soon as their enquiry or application is saved, then sends it to LITMUS. If LITMUS can’t take it, the full admins get an email with its details, sent through ZeptoMail with these settings."
        actions={
          <>
            <button className="btn btn-light" onClick={runTest} disabled={busy !== null || dirty || !saved.token || !saved.fromAddress}>
              <Icon name="Send" /> {busy === 'test' ? 'Sending…' : 'Send me a test'}
            </button>
            <button className="btn" onClick={save} disabled={busy !== null || !dirty}>
              <Icon name="Save" /> {busy === 'save' ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      />
      <div className="detail-grid">
        <div className="card">
          <label className="check">
            <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
            Email the admins when a submission can’t be sent to LITMUS
          </label>
          <div className="field">
            <label htmlFor="zepto-url">ZeptoMail API address</label>
            <input id="zepto-url" type="url" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value.trim() })} />
            <p className="help">
              From ZeptoMail → Mail Agents → your agent → SMTP/API → API. It is https://api.zeptomail.com/v1.1/email for the US data centre
              (api.zeptomail.in for India, api.zeptomail.eu for Europe).
            </p>
          </div>
          <div className="field">
            <label htmlFor="zepto-token">Send Mail token</label>
            <div className="input-with-btn">
              <input
                id="zepto-token"
                type={reveal ? 'text' : 'password'}
                autoComplete="off"
                placeholder="Zoho-enczapikey wSsVR6…"
                value={draft.token}
                onChange={(e) => setDraft({ ...draft, token: e.target.value })}
              />
              <button type="button" className="icon-btn" aria-label={reveal ? 'Hide token' : 'Show token'} onClick={() => setReveal(!reveal)}>
                <Icon name={reveal ? 'EyeOff' : 'Eye'} />
              </button>
            </div>
            <p className="help">On the same ZeptoMail page. Only admins can see this. It is never sent to website visitors.</p>
          </div>
          <div className="field">
            <label htmlFor="zepto-from">From address</label>
            <input id="zepto-from" type="email" placeholder="noreply@crossmaze.in" value={draft.fromAddress} onChange={(e) => setDraft({ ...draft, fromAddress: e.target.value.trim() })} />
            <p className="help">An address on a domain verified in ZeptoMail (crossmaze.in).</p>
          </div>
          <div className="field">
            <label htmlFor="zepto-name">From name</label>
            <input id="zepto-name" value={draft.fromName} onChange={(e) => setDraft({ ...draft, fromName: e.target.value })} />
          </div>
          {dirty && saved.token && <p className="muted">Save first, then send a test.</p>}
          {test && (
            <div className={`test-result ${test.status === 'sent' ? 'ok' : 'bad'}`}>
              <strong>
                {test.status === 'sent'
                  ? 'ZeptoMail accepted the test. Check your inbox (and spam) in a minute.'
                  : (test.error ?? 'The test failed.')}
              </strong>
            </div>
          )}
        </div>
        <div className="card">
          <h3>Who gets the alerts</h3>
          <p className="muted">Every full admin (Admins page), one email per submission that couldn’t be sent:</p>
          {admins === undefined ? (
            <Spinner />
          ) : admins.length ? (
            <ul>
              {admins.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No full admins found.</p>
          )}
          <p className="muted">
            The email has everything the visitor filled in, so the school can call them back while the website keeps trying LITMUS every 30
            minutes. Submissions shows each one’s LITMUS status.
          </p>
        </div>
      </div>
    </>
  );
}
