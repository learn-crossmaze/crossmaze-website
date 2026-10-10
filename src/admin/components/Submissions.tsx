import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { Icon } from './fields';
import { ErrorBox, PageHeader, Spinner, errorText, formatDate, useSession, useToast } from './ui';

interface Submission {
  id: string;
  type: 'admission_enquiry' | 'job_application';
  data: Record<string, string>;
  page?: string;
  createdAt?: { toDate: () => Date };
  handled?: boolean;
  litmus?: { status: string; attempts?: number; lastError?: string; httpStatus?: number; sentAt?: unknown };
  /** Uploaded files (the resume), stored privately in Cloud Storage. */
  files?: { field: string; path: string; name: string }[];
}

// Field labels; keep in sync with functions/lib/forms.js.
const FIELDS: Record<Submission['type'], [string, string][]> = {
  admission_enquiry: [
    ['parent_name', 'Parent name'],
    ['phone', 'Phone'],
    ['email', 'Email'],
    ['child_name', 'Child name'],
    ['child_age', 'Child age'],
    ['program', 'Program'],
    ['branch', 'Branch'],
    ['message', 'Message'],
  ],
  job_application: [
    ['name', 'Name'],
    ['phone', 'Phone'],
    ['email', 'Email'],
    ['position', 'Position'],
    ['branch', 'Preferred branch'],
    ['experience', 'Experience'],
    ['qualification', 'Qualification'],
    ['resume_link', 'Resume'],
    ['about', 'About'],
  ],
};
const TYPE_LABEL = { admission_enquiry: 'Admission enquiry', job_application: 'Job application' };
const LITMUS_LABEL: Record<string, string> = {
  sent: 'Sent to LITMUS',
  failed: 'LITMUS failed',
  pending: 'Sending…',
  not_configured: 'Not sent (LITMUS not set up)',
};

const nameOf = (s: Submission) => s.data.parent_name || s.data.name || '–';
const whatOf = (s: Submission) =>
  s.type === 'admission_enquiry' ? [s.data.program, s.data.branch].filter(Boolean).join(' · ') : s.data.position;

function toCsv(rows: Submission[]) {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r.data)))];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['date', 'type', ...keys, 'page', 'handled', 'litmus'];
  const lines = rows.map((r) =>
    [r.createdAt?.toDate().toISOString(), r.type, ...keys.map((k) => r.data[k]), r.page, r.handled ? 'yes' : 'no', r.litmus?.status].map(esc).join(','),
  );
  return [header.map(esc).join(','), ...lines].join('\n');
}

export function SubmissionsPage({ id }: { id?: string }) {
  const { services } = useSession();
  const toast = useToast();
  const [rows, setRows] = useState<Submission[]>();
  const [error, setError] = useState<string>();
  const [type, setType] = useState<'all' | Submission['type']>('all');
  const [show, setShow] = useState<'all' | 'new' | 'unsent'>('all');
  const [busy, setBusy] = useState(false);

  useEffect(
    () =>
      onSnapshot(
        query(collection(services.db, 'submissions'), orderBy('createdAt', 'desc'), limit(500)),
        (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) }))),
        (e) => setError(e.message),
      ),
    [services],
  );

  const filtered = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          (type === 'all' || r.type === type) &&
          (show === 'all' || (show === 'new' ? !r.handled : r.litmus?.status !== 'sent')),
      ),
    [rows, type, show],
  );

  const resend = async (ids?: string[]) => {
    setBusy(true);
    try {
      const fn = httpsCallable<{ ids?: string[] }, Record<string, number>>(services.functions, 'resendSubmissions');
      const { data } = await fn(ids ? { ids } : {});
      toast(
        data.failed || data.not_configured ? 'error' : 'ok',
        `Sent: ${data.sent ?? 0}. Failed: ${data.failed ?? 0}.${data.not_configured ? ' LITMUS isn’t set up yet (see the LITMUS page).' : ''}`,
      );
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `crossmaze-submissions-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (error) return <ErrorBox>{errorText(error)}</ErrorBox>;
  if (!rows) return <Spinner />;

  const selected = id ? rows.find((r) => r.id === id) : undefined;
  if (id && !selected) return <ErrorBox>That submission no longer exists.</ErrorBox>;
  if (selected) return <SubmissionDetail s={selected} onResend={() => resend([selected.id])} busy={busy} />;

  const unsent = rows.filter((r) => r.litmus?.status !== 'sent').length;

  return (
    <>
      <PageHeader
        title="Submissions"
        intro="Admission enquiries and job applications from the website. Every submission is saved here and forwarded to LITMUS."
        actions={
          <>
            <button className="btn btn-light" onClick={download} disabled={!filtered.length}>
              <Icon name="Download" /> Export CSV
            </button>
            <button className="btn" onClick={() => resend()} disabled={busy || !unsent}>
              <Icon name="Send" /> {busy ? 'Sending…' : `Send ${unsent} unsent to LITMUS`}
            </button>
          </>
        }
      />
      <div className="filters">
        <div className="segmented" role="group" aria-label="Form">
          {(['all', 'admission_enquiry', 'job_application'] as const).map((t) => (
            <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>
              {t === 'all' ? 'All' : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Show">
          {(['all', 'new', 'unsent'] as const).map((t) => (
            <button key={t} className={show === t ? 'on' : ''} onClick={() => setShow(t)}>
              {t === 'all' ? 'Everything' : t === 'new' ? 'Not handled' : 'Not in LITMUS'}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="card empty">Nothing here yet.</div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Form</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Details</th>
                <th>LITMUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className={s.handled ? '' : 'unread'} onClick={() => (window.location.hash = `#/submissions/${s.id}`)}>
                  <td>{formatDate(s.createdAt)}</td>
                  <td>{TYPE_LABEL[s.type]}</td>
                  <td>
                    <a href={`#/submissions/${s.id}`}>{nameOf(s)}</a>
                  </td>
                  <td>{s.data.phone}</td>
                  <td>{whatOf(s)}</td>
                  <td>
                    <span className={`chip chip-${s.litmus?.status ?? 'pending'}`}>{LITMUS_LABEL[s.litmus?.status ?? 'pending'] ?? s.litmus?.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function SubmissionDetail({ s, onResend, busy }: { s: Submission; onResend: () => void; busy: boolean }) {
  const { services } = useSession();
  const toast = useToast();
  const ref = doc(services.db, 'submissions', s.id);
  return (
    <>
      <PageHeader
        title={nameOf(s)}
        back={{ href: '#/submissions', label: 'Submissions' }}
        intro={`${TYPE_LABEL[s.type]} · received ${formatDate(s.createdAt)}${s.page ? ` from ${s.page}` : ''}`}
        actions={
          <>
            <button
              className="btn btn-light danger"
              onClick={async () => {
                const what = s.files?.length ? 'this submission and its resume' : 'this submission';
                if (!confirm(`Delete ${what}? This can’t be undone.`)) return;
                try {
                  for (const f of s.files ?? []) {
                    await deleteObject(storageRef(services.storage, f.path)).catch((e) => {
                      if (e?.code !== 'storage/object-not-found') throw e;
                    });
                  }
                  await deleteDoc(ref);
                  window.location.hash = '#/submissions';
                } catch (e) {
                  toast('error', errorText(e));
                }
              }}
            >
              <Icon name="Trash2" /> Delete
            </button>
            <button className="btn btn-light" onClick={() => updateDoc(ref, { handled: !s.handled }).catch((e) => toast('error', errorText(e)))}>
              <Icon name="CircleCheck" /> {s.handled ? 'Mark as not handled' : 'Mark as handled'}
            </button>
          </>
        }
      />
      <div className="detail-grid">
        <div className="card">
          <dl className="details">
            {FIELDS[s.type].map(([key, label]) =>
              s.data[key] ? (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>
                    {key === 'phone' ? (
                      <a href={`tel:${s.data[key]}`}>{s.data[key]}</a>
                    ) : key === 'email' ? (
                      <a href={`mailto:${s.data[key]}`}>{s.data[key]}</a>
                    ) : key === 'resume_link' ? (
                      <a href={s.data[key]} target="_blank" rel="noopener noreferrer">
                        {s.data.resume_file ? `Open ${s.data.resume_file}` : s.data[key]}
                      </a>
                    ) : (
                      s.data[key]
                    )}
                  </dd>
                </div>
              ) : null,
            )}
          </dl>
        </div>
        <div className="card">
          <h3>LITMUS</h3>
          <p>
            <span className={`chip chip-${s.litmus?.status ?? 'pending'}`}>{LITMUS_LABEL[s.litmus?.status ?? 'pending'] ?? s.litmus?.status}</span>
          </p>
          {s.litmus?.sentAt != null && <p className="muted">Delivered {formatDate(s.litmus.sentAt)}</p>}
          {s.litmus?.lastError && <p className="error-text">{s.litmus.lastError}</p>}
          {!!s.litmus?.attempts && <p className="muted">Attempts: {s.litmus.attempts}</p>}
          <button className="btn btn-light btn-sm" disabled={busy} onClick={onResend}>
            <Icon name="RefreshCw" size={16} /> {busy ? 'Sending…' : 'Send to LITMUS again'}
          </button>
        </div>
      </div>
    </>
  );
}
