import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useDoc } from '../data';
import { Icon } from './fields';
import { ErrorBox, PageHeader, Spinner, errorText, useSession, useToast } from './ui';

/**
 * The school's one Google Maps key (private/maps; only admins can read it). Every branch's "Search Google Maps"
 * (components/MapPlace.tsx) uses it, so it is added and changed here, once.
 */
export function GoogleMapsPage() {
  const { services } = useSession();
  const toast = useToast();
  const { data, loading, error } = useDoc<{ key?: string }>(services.db, 'private/maps');
  const saved = data?.key?.trim() ?? '';
  const [draft, setDraft] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading) setDraft(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, saved]);

  const save = async (key: string) => {
    if (key && key.length < 20) return toast('error', 'That doesn’t look like a Google API key (they start with AIza and are about 39 characters).');
    setBusy(true);
    try {
      await setDoc(doc(services.db, 'private/maps'), { key });
      setDraft(key);
      toast('ok', key ? 'Saved. Every branch’s Google Maps search uses this key.' : 'Key removed. Branches can still paste a Google Maps link.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  return (
    <>
      <PageHeader
        title="Google Maps"
        intro="One Google Maps key for the whole school: every branch’s “Search Google Maps” (Branches → a branch → Google Maps location) uses it to find the centre’s listing. Without it, branches can still paste a link from Google Maps."
        actions={
          <button className="btn" onClick={() => void save(draft.trim())} disabled={busy || draft.trim() === saved}>
            <Icon name="Save" /> {busy ? 'Saving…' : 'Save'}
          </button>
        }
      />
      <div className="detail-grid">
        <div className="card">
          <p className="maps-key-status">
            <Icon name={saved ? 'CircleCheck' : 'CircleAlert'} /> {saved ? 'A key is saved: Google Maps search works on every branch.' : 'No key yet: Google Maps search is off.'}
          </p>
          <div className="field">
            <label htmlFor="maps-key">API key</label>
            <div className="input-with-btn">
              <input id="maps-key" type={reveal ? 'text' : 'password'} autoComplete="off" placeholder="AIza…" value={draft} onChange={(e) => setDraft(e.target.value)} />
              <button type="button" className="icon-btn" aria-label={reveal ? 'Hide API key' : 'Show API key'} onClick={() => setReveal(!reveal)}>
                <Icon name={reveal ? 'EyeOff' : 'Eye'} />
              </button>
            </div>
            <p className="help">Only admins can see this. It is used in the admin panel only, never on the website.</p>
          </div>
          {saved && (
            <button className="btn btn-light btn-sm" onClick={() => void save('')} disabled={busy}>
              <Icon name="Trash2" /> Remove the key
            </button>
          )}
        </div>
        <div className="card">
          <h3>Getting a key</h3>
          <ol className="maps-key-steps">
            <li>Open Google Cloud console and choose the website’s Firebase project. Billing must be on; a few admins searching stays within Google’s free monthly allowance.</li>
            <li>APIs &amp; Services → Library: turn on <b>Maps JavaScript API</b> and <b>Places API (New)</b>.</li>
            <li>APIs &amp; Services → Credentials → Create credentials → API key.</li>
            <li>
              Restrict the key: Application restrictions → Websites → <code>https://www.crossmaze.in/*</code>; API restrictions → only those two APIs.
            </li>
            <li>Paste it here and save.</li>
          </ol>
        </div>
      </div>
    </>
  );
}
