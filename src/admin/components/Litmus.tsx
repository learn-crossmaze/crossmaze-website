import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { same, useDoc } from '../data';
import { Icon } from './fields';
import { ErrorBox, PageHeader, Spinner, errorText, useSession, useToast } from './ui';

interface LitmusConfig {
  enabled: boolean;
  url: string;
  headerName: string;
  headerValue: string;
}

const EMPTY: LitmusConfig = { enabled: false, url: '', headerName: 'Authorization', headerValue: '' };

const SAMPLE = `POST <your LITMUS URL>
Content-Type: application/json
X-Crossmaze-Submission-Id: 9fQx2kL…          (same id on every retry)
<your header name>: <your key>                (if set)

{
  "id": "9fQx2kL…",
  "type": "admission_enquiry",               // or "job_application"
  "submittedAt": "2026-10-07T10:15:00.000Z",
  "source": { "site": "www.crossmaze.in", "page": "/branch/crossmaze-neotown" },
  "data": {
    "parent_name": "…", "phone": "…", "email": "…",
    "child_name": "…", "child_age": "…",
    "program": "Nursery", "branch": "Crossmaze – Neotown", "message": "…"
  }
}

Job applications send: name, phone, email, position, branch,
experience, qualification, resume_link, about.
Reply with any 2xx status to confirm. Anything else is retried every
30 minutes (up to 6 times) and shown as "LITMUS failed" in Submissions.`;

export function LitmusPage() {
  const { services } = useSession();
  const toast = useToast();
  const { data, loading, error } = useDoc<LitmusConfig>(services.db, 'private/litmus');
  const [draft, setDraft] = useState<LitmusConfig>(EMPTY);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const [test, setTest] = useState<{ status: string; httpStatus?: number; error?: string; response?: string }>();
  const saved = { ...EMPTY, ...data };
  const dirty = !same(draft, saved);

  useEffect(() => {
    if (!loading) setDraft({ ...EMPTY, ...data });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const save = async () => {
    if (draft.enabled && !/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(draft.url)) {
      toast('error', 'The LITMUS URL must start with https://');
      return;
    }
    setBusy('save');
    try {
      await setDoc(doc(services.db, 'private/litmus'), draft);
      toast('ok', draft.enabled ? 'Saved. New submissions will be sent to LITMUS.' : 'Saved. Sending to LITMUS is switched off.');
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
      const fn = httpsCallable<void, typeof test>(services.functions, 'testLitmus');
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
        title="LITMUS"
        intro="Every admission enquiry and job application from the website is saved in Submissions and also sent to LITMUS using these settings."
        actions={
          <>
            <button className="btn btn-light" onClick={runTest} disabled={busy !== null || dirty || !saved.url}>
              <Icon name="Send" /> {busy === 'test' ? 'Testing…' : 'Send test'}
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
            Send website submissions to LITMUS
          </label>
          <div className="field">
            <label htmlFor="litmus-url">LITMUS URL</label>
            <input id="litmus-url" type="url" placeholder="https://litmus.example.com/api/leads" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value.trim() })} />
            <p className="help">The address in LITMUS that accepts new leads. Your LITMUS team will give you this.</p>
          </div>
          <div className="field">
            <label htmlFor="litmus-header">Authentication header name</label>
            <input id="litmus-header" value={draft.headerName} onChange={(e) => setDraft({ ...draft, headerName: e.target.value.trim() })} />
            <p className="help">Usually “Authorization” or “X-Api-Key”. Leave the key empty if LITMUS doesn’t need one.</p>
          </div>
          <div className="field">
            <label htmlFor="litmus-key">Key</label>
            <div className="input-with-btn">
              <input
                id="litmus-key"
                type={reveal ? 'text' : 'password'}
                autoComplete="off"
                placeholder="e.g. Bearer abc123…"
                value={draft.headerValue}
                onChange={(e) => setDraft({ ...draft, headerValue: e.target.value })}
              />
              <button type="button" className="icon-btn" aria-label={reveal ? 'Hide key' : 'Show key'} onClick={() => setReveal(!reveal)}>
                <Icon name={reveal ? 'EyeOff' : 'Eye'} />
              </button>
            </div>
            <p className="help">Only admins can see this. It is never sent to website visitors.</p>
          </div>
          {dirty && saved.url && <p className="muted">Save first, then send a test.</p>}
          {test && (
            <div className={`test-result ${test.status === 'sent' ? 'ok' : 'bad'}`}>
              <strong>{test.status === 'sent' ? `LITMUS accepted the test (HTTP ${test.httpStatus}).` : test.error ?? 'The test failed.'}</strong>
              {test.response && <pre>{test.response}</pre>}
            </div>
          )}
        </div>
        <div className="card">
          <h3>For the LITMUS team</h3>
          <p className="muted">What LITMUS receives for each submission:</p>
          <pre className="code">{SAMPLE}</pre>
        </div>
      </div>
    </>
  );
}
