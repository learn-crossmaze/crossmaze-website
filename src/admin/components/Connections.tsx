import { EmailAlertsPage } from './EmailAlerts';
import { GoogleMapsPage } from './GoogleMaps';
import { LitmusPage } from './Litmus';
import { Icon } from './fields';

/**
 * Every outside service the website talks to, with its address and key, on one page with a tab each (full admins):
 * LITMUS (where enquiries go), Zoho CPaaS (email alerts) and Google Maps (the branch search). The keys stay in
 * Firestore's private documents, which only admins can read.
 */
export const CONNECTIONS = [
  { id: 'litmus', icon: 'Plug', label: 'LITMUS', note: 'Where enquiries and applications are sent' },
  { id: 'email-alerts', icon: 'Mail', label: 'Email alerts', note: 'Zoho CPaaS, for emails to admins' },
  { id: 'google-maps', icon: 'MapPin', label: 'Google Maps', note: 'The key for branch map search' },
] as const;

export type ConnectionId = (typeof CONNECTIONS)[number]['id'];

export function ConnectionsPage({ tab }: { tab?: string }) {
  const current: ConnectionId = CONNECTIONS.some((c) => c.id === tab) ? (tab as ConnectionId) : 'litmus';
  return (
    <>
      <nav className="conn-tabs" aria-label="Connections">
        {CONNECTIONS.map((c) => (
          <a key={c.id} href={`#/connections/${c.id}`} className={c.id === current ? 'active' : ''} aria-current={c.id === current ? 'page' : undefined}>
            <Icon name={c.icon} />
            <span>
              <b>{c.label}</b>
              <small>{c.note}</small>
            </span>
          </a>
        ))}
      </nav>
      {current === 'litmus' ? <LitmusPage /> : current === 'email-alerts' ? <EmailAlertsPage /> : <GoogleMapsPage />}
    </>
  );
}
