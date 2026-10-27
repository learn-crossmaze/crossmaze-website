import { useEffect, useState } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { same, useDoc } from '../data';
import { Icon } from './fields';
import { ErrorBox, PageHeader, Spinner, errorText, useSession, useToast } from './ui';

/** Zoho CPaaS (formerly ZeptoMail) settings for the emails to admins (functions/lib/zeptomail.js reads the same document). */
interface EmailConfig {
  enabled: boolean;
  url: string;
  token: string;
  fromAddress: string;
  fromName: string;
}

const EMPTY: EmailConfig = { enabled: false, url: 'https://cpaas.zoho.com/v1.1/email', token: '', fromAddress: '', fromName: 'Crossmaze website' };

// The API hosts, one per data centre: cpaas.zoho.* (Canada: cpaas.zohocloud.ca), or api.zeptomail.* from
// before ZeptoMail became Zoho CPaaS. Keep in step with API_HOST in functions/lib/zeptomail.js.
const API_HOST = /^(cpaas\.(zoho\.(com|in|eu|com\.au|jp|sa|com\.cn)|zohocloud\.ca)|api\.zeptomail\.(com|in|eu|com\.au|jp|ca|sa|com\.cn))$/;
const isApiUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && API_HOST.test(parsed.hostname);
  } catch {
    return false;
  }
};
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
      if (!isApiUrl(draft.url)) return toast('error', 'The API address must be a Zoho CPaaS one, such as https://cpaas.zoho.com/v1.1/email');
      if (!draft.token.trim()) return toast('error', 'Paste the API key from Zoho CPaaS.');
      if (!EMAIL.test(draft.fromAddress)) return toast('error', 'Enter the From address, e.g. noreply@crossmaze.in');
    }
    setBusy('save');
    try {
      // Saved as trimmed, and the form shows what was saved (else it stays "unsaved").
      const next = { ...draft, token: draft.token.trim() };
      await setDoc(doc(services.db, 'private/zeptomail'), next);
      setDraft(next);
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
        intro="The website thanks visitors as soon as their enquiry or application is saved, then sends it to LITMUS. If LITMUS can’t take it, the full admins get an email with its details, sent through Zoho CPaaS (formerly ZeptoMail) with these settings."
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
            <label htmlFor="zepto-url">API address</label>
            <input id="zepto-url" type="url" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value.trim() })} />
            <p className="help">
              In Zoho CPaaS (cpaas.zoho.com) → Agents → your agent → SMTP/API → API Setup. It is https://cpaas.zoho.com/v1.1/email for the US
              data centre (cpaas.zoho.in for India, cpaas.zoho.eu for Europe). An older api.zeptomail.com address still works.
            </p>
          </div>
          <div className="field">
            <label htmlFor="zepto-token">API key</label>
            <div className="input-with-btn">
              <input
                id="zepto-token"
                type={reveal ? 'text' : 'password'}
                autoComplete="off"
                placeholder="Zoho-enczapikey wSsVR6…"
                value={draft.token}
                onChange={(e) => setDraft({ ...draft, token: e.target.value })}
              />
              <button type="button" className="icon-btn" aria-label={reveal ? 'Hide API key' : 'Show API key'} onClick={() => setReveal(!reveal)}>
                <Icon name={reveal ? 'EyeOff' : 'Eye'} />
              </button>
            </div>
            <p className="help">The Agent key on the same page (a ZeptoMail Send Mail token still works). Only admins can see this. It is never sent to website visitors.</p>
          </div>
          <div className="field">
            <label htmlFor="zepto-from">From address</label>
            <input id="zepto-from" type="email" placeholder="noreply@crossmaze.in" value={draft.fromAddress} onChange={(e) => setDraft({ ...draft, fromAddress: e.target.value.trim() })} />
            <p className="help">An address on a domain verified in Zoho CPaaS (crossmaze.in).</p>
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
                  ? 'Zoho CPaaS accepted the test. Check your inbox (and spam) in a minute.'
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
            <ul className="recipients">
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
