import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useDoc } from '../data';
import { Icon } from './fields';
import { PageHeader, errorText, formatDate, useSession, useToast } from './ui';

interface PublishMeta {
  status?: 'building' | 'live' | 'failed';
  requestedAt?: { toMillis: () => number };
  requestedBy?: string;
  finishedAt?: { toMillis: () => number };
  runUrl?: string;
  actionsUrl?: string;
}
interface ContentMeta {
  updatedAt?: { toMillis: () => number };
  updatedBy?: string;
}

export function usePublishState() {
  const { services } = useSession();
  const publish = useDoc<PublishMeta>(services.db, 'meta/publish').data;
  const content = useDoc<ContentMeta>(services.db, 'meta/content').data;
  const lastPublish = Math.max(publish?.requestedAt?.toMillis() ?? 0, 0);
  const unpublished = Boolean(content?.updatedAt && content.updatedAt.toMillis() > lastPublish);
  return { publish, content, unpublished };
}

export function PublishButton({ compact = false }: { compact?: boolean }) {
  const { services } = useSession();
  const toast = useToast();
  const { publish, unpublished } = usePublishState();
  const [busy, setBusy] = useState(false);
  const building = publish?.status === 'building';

  const run = async () => {
    if (!confirm('Publish all saved changes to www.crossmaze.in? The site updates in about 3 minutes.')) return;
    setBusy(true);
    try {
      await httpsCallable(services.functions, 'publishSite')();
      toast('ok', 'Publishing started. The website will update in about 3 minutes.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className={`btn ${unpublished ? 'btn-sun' : 'btn-light'}`} onClick={run} disabled={busy || building} title={unpublished ? 'You have saved changes that are not on the website yet' : undefined}>
      <Icon name={building ? 'RefreshCw' : 'Rocket'} className={building ? 'spin' : ''} />
      {building ? 'Publishing…' : compact ? 'Publish' : unpublished ? 'Publish changes' : 'Publish'}
    </button>
  );
}

function useCount(field: string, op: '==' | 'in', value: unknown) {
  const { services } = useSession();
  const [count, setCount] = useState<number>();
  useEffect(
    () =>
      onSnapshot(
        query(collection(services.db, 'submissions'), where(field, op, value)),
        (snap) => setCount(snap.size),
        () => setCount(undefined),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [services, field, op],
  );
  return count;
}

const links = [
  { href: '#/site', icon: 'Settings', title: 'Site settings', text: 'Logo, phone, emails, address, home page text' },
  { href: '#/branches', icon: 'Building', title: 'Branches', text: 'Addresses, photos, centre heads, amenities' },
  { href: '#/programs', icon: 'BookMarked', title: 'Programs', text: 'Names, ages, timings, descriptions, photos' },
  { href: '#/jobs', icon: 'Briefcase', title: 'Jobs', text: 'Open positions on the careers page' },
  { href: '#/testimonials', icon: 'Quote', title: 'Testimonials', text: 'What parents say' },
  { href: '#/sections', icon: 'LayoutList', title: 'Page sections', text: 'Values, facilities, FAQs and more' },
];

export function Dashboard() {
  const { email } = useSession();
  const { publish, content, unpublished } = usePublishState();
  const newCount = useCount('handled', '==', false);
  const problems = useCount('litmus.status', 'in', ['failed', 'not_configured']);

  const status =
    publish?.status === 'building'
      ? { tone: 'pending', text: 'Publishing now…' }
      : publish?.status === 'failed'
        ? { tone: 'failed', text: 'The last publish failed' }
        : publish?.status === 'live'
          ? { tone: 'sent', text: 'Website is up to date' }
          : { tone: 'pending', text: 'Not published from the admin panel yet' };

  return (
    <>
      <PageHeader title="Dashboard" intro={`Signed in as ${email}`} />
      <div className="stat-grid">
        <div className="card publish-card">
          <h3>Website</h3>
          <p>
            <span className={`chip chip-${status.tone}`}>{unpublished && publish?.status !== 'building' ? 'Unpublished changes' : status.text}</span>
          </p>
          <p className="muted">
            {content?.updatedAt && <>Last change {formatDate(content.updatedAt)}{content.updatedBy ? ` by ${content.updatedBy}` : ''}. </>}
            {publish?.finishedAt && <>Last published {formatDate(publish.finishedAt)}.</>}
          </p>
          {publish?.status === 'failed' && publish.runUrl && (
            <p>
              <a href={publish.runUrl} target="_blank" rel="noopener">
                See what went wrong <Icon name="ExternalLink" size={14} />
              </a>
            </p>
          )}
          <PublishButton />
        </div>
        <a className="card stat" href="#/submissions">
          <span className="stat-value">{newCount ?? '–'}</span>
          <span>new submissions to follow up</span>
        </a>
        <a className="card stat" href="#/litmus">
          <span className={`stat-value ${problems ? 'warn' : ''}`}>{problems ?? '–'}</span>
          <span>submissions not delivered to LITMUS</span>
        </a>
      </div>
      <h2 className="section-title">Edit the website</h2>
      <div className="link-grid">
        {links.map((l) => (
          <a key={l.href} className="card link-card" href={l.href}>
            <Icon name={l.icon} size={24} />
            <strong>{l.title}</strong>
            <span>{l.text}</span>
          </a>
        ))}
      </div>
      <p className="muted how">
        How it works: changes you save are stored safely but don’t appear on the website until you press <strong>Publish</strong>. Publishing
        rebuilds the whole site with your changes, which takes about 3 minutes.
      </p>
    </>
  );
}
