import { useEffect, useMemo, useState } from 'react';
import { Timestamp, collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Icon } from './fields';
import { ErrorBox, PageHeader, Spinner, formatDate, useSession } from './ui';

/** A tap on a call or WhatsApp button on the website (recorded by functions/lib/calls.js). */
interface CallTap {
  id: string;
  channel: 'phone' | 'whatsapp';
  number: string;
  branch?: string;
  page?: string;
  place?: string;
  source?: string;
  visit?: string;
  device?: string;
  createdAt?: { toDate: () => Date };
}

const PERIODS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 3 months' },
];
const MAX_ROWS = 5000;
const CHANNEL_LABEL = { phone: 'Call', whatsapp: 'WhatsApp' } as const;

/** 917338045201 → +91 73380 45201 */
const prettyNumber = (n: string) => (n.length === 12 && n.startsWith('91') ? `+91 ${n.slice(2, 7)} ${n.slice(7)}` : n);
const centreOf = (c: CallTap) => c.branch || prettyNumber(c.number);
const pageOf = (c: CallTap) => (c.page === '/' ? 'Home' : (c.page ?? ''));

/** Counts by a key, largest first. */
function tally(rows: CallTap[], key: (c: CallTap) => string) {
  const counts = new Map<string, { calls: number; whatsapp: number }>();
  for (const r of rows) {
    const k = key(r) || 'Unknown';
    const entry = counts.get(k) ?? { calls: 0, whatsapp: 0 };
    if (r.channel === 'whatsapp') entry.whatsapp += 1;
    else entry.calls += 1;
    counts.set(k, entry);
  }
  return [...counts].map(([name, c]) => ({ name, ...c, total: c.calls + c.whatsapp })).sort((a, b) => b.total - a.total);
}

function toCsv(rows: CallTap[]) {
  // Some values come from the visitor's browser; a leading = + - or @ would run as a spreadsheet formula.
  const esc = (v: unknown) => `"${String(v ?? '').replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`;
  const header = ['date', 'type', 'centre', 'number', 'page', 'where on the page', 'device', 'came from', 'visit'];
  const lines = rows.map((r) =>
    [r.createdAt?.toDate().toISOString(), CHANNEL_LABEL[r.channel], r.branch, prettyNumber(r.number), r.page, r.place, r.device, r.source, r.visit]
      .map(esc)
      .join(','),
  );
  return [header.map(esc).join(','), ...lines].join('\n');
}

export function CallsPage() {
  const { services } = useSession();
  const [days, setDays] = useState(7);
  const [channel, setChannel] = useState<'all' | CallTap['channel']>('all');
  const [rows, setRows] = useState<CallTap[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setRows(undefined);
    const since = Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
    return onSnapshot(
      query(collection(services.db, 'calls'), where('createdAt', '>=', since), orderBy('createdAt', 'desc'), limit(MAX_ROWS)),
      (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CallTap, 'id'>) }))),
      (e) => setError(e.message),
    );
  }, [services, days]);

  const shown = useMemo(() => (rows ?? []).filter((r) => channel === 'all' || r.channel === channel), [rows, channel]);
  const summary = useMemo(() => {
    const calls = shown.filter((r) => r.channel === 'phone').length;
    return {
      calls,
      whatsapp: shown.length - calls,
      // One visit = one person, however many times they tapped.
      people: new Set(shown.map((r) => r.visit || r.id)).size,
      onPhones: shown.filter((r) => r.device === 'Phone').length,
      byCentre: tally(shown, centreOf),
      bySource: tally(shown, (r) => r.source ?? '').slice(0, 8),
    };
  }, [shown]);

  const download = () => {
    const blob = new Blob([toCsv(shown)], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `crossmaze-calls-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (error) return <ErrorBox>{error}</ErrorBox>;

  return (
    <>
      <PageHeader
        title="Calls"
        intro="Every tap on a call or WhatsApp button on the website. The website can’t see who called or whether the call got through, only that someone tapped to call, which centre, from which page and on what device."
        actions={
          <button className="btn btn-light" onClick={download} disabled={!shown.length}>
            <Icon name="Download" /> Export CSV
          </button>
        }
      />
      <div className="filters">
        <div className="segmented" role="group" aria-label="Period">
          {PERIODS.map((p) => (
            <button key={p.days} className={days === p.days ? 'on' : ''} onClick={() => setDays(p.days)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Type">
          {(['all', 'phone', 'whatsapp'] as const).map((c) => (
            <button key={c} className={channel === c ? 'on' : ''} onClick={() => setChannel(c)}>
              {c === 'all' ? 'Calls and WhatsApp' : c === 'phone' ? 'Calls' : 'WhatsApp'}
            </button>
          ))}
        </div>
      </div>

      {!rows ? (
        <Spinner />
      ) : (
        <>
          <div className="stat-row">
            <div className="card stat">
              <span className="stat-value">{summary.people}</span>
              <span>people tapped to get in touch</span>
            </div>
            <div className="card stat">
              <span className="stat-value">{summary.calls}</span>
              <span>taps on a call button</span>
            </div>
            <div className="card stat">
              <span className="stat-value">{summary.whatsapp}</span>
              <span>taps on WhatsApp</span>
            </div>
            <div className="card stat">
              <span className="stat-value">{shown.length ? Math.round((summary.onPhones / shown.length) * 100) : 0}%</span>
              <span>of taps were on a phone</span>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="card empty">No taps in this period yet.</div>
          ) : (
            <>
              <div className="calls-grid">
                <div className="card">
                  <h3>By centre</h3>
                  <Breakdown rows={summary.byCentre} max={summary.byCentre[0]?.total ?? 1} />
                </div>
                <div className="card">
                  <h3>How they found the website</h3>
                  <Breakdown rows={summary.bySource} max={summary.bySource[0]?.total ?? 1} />
                  <p className="muted small">“Direct” means a typed address, a bookmark or an app that doesn’t say where the visitor came from.</p>
                </div>
              </div>

              <h2 className="section-title">Every tap</h2>
              <div className="table-wrap card">
                <table className="table plain">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Type</th>
                      <th>Centre</th>
                      <th>Where</th>
                      <th>Device</th>
                      <th>Came from</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((c) => (
                      <tr key={c.id}>
                        <td>{formatDate(c.createdAt)}</td>
                        <td>
                          <span className={`chip ${c.channel === 'whatsapp' ? 'chip-sent' : ''}`}>
                            <Icon name={c.channel === 'whatsapp' ? 'MessageCircle' : 'Phone'} size={14} />
                            {CHANNEL_LABEL[c.channel]}
                          </span>
                        </td>
                        <td>{centreOf(c)}</td>
                        <td className="where">
                          {c.place || '–'}
                          <small>{pageOf(c)}</small>
                        </td>
                        <td>{c.device}</td>
                        <td>{c.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length >= MAX_ROWS && <p className="muted small">Showing the latest {MAX_ROWS} taps. Export or pick a shorter period to see the rest.</p>}
            </>
          )}
        </>
      )}
    </>
  );
}

function Breakdown({ rows, max }: { rows: ReturnType<typeof tally>; max: number }) {
  return (
    <ul className="breakdown">
      {rows.map((r) => (
        <li key={r.name}>
          <span className="breakdown-name">
            {r.name}
            <small>
              {r.calls} call{r.calls === 1 ? '' : 's'}
              {r.whatsapp ? `, ${r.whatsapp} WhatsApp` : ''}
            </small>
          </span>
          <span className="breakdown-track">
            <span className="breakdown-bar" style={{ width: `${Math.max(3, (r.total / max) * 100)}%` }} />
          </span>
          <span className="breakdown-count">{r.total}</span>
        </li>
      ))}
    </ul>
  );
}
