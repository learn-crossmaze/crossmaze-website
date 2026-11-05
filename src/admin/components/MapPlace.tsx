import { useEffect, useId, useRef, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useDoc } from '../data';
import { mapEmbed, mapLocation, placeLink } from '../../data/maps';
import { errorText, useSession } from './ui';

/**
 * A branch's map field (src/data/maps.ts): search Google Maps for the centre and pick its listing, or paste a
 * Google Maps link or coordinates. The search uses Google's Places API with the school's own key, which an admin
 * adds here once (private/maps; only admins can read it).
 */

// The few parts of Google's Maps JavaScript API used here.
interface Suggestion {
  placePrediction: { text: { text: string }; secondaryText?: { text: string }; toPlace: () => GPlace } | null;
}
interface GPlace {
  id: string;
  displayName?: string;
  formattedAddress?: string;
  location?: { lat: () => number; lng: () => number };
  fetchFields: (o: { fields: string[] }) => Promise<unknown>;
}
interface PlacesLibrary {
  AutocompleteSuggestion: { fetchAutocompleteSuggestions: (r: object) => Promise<{ suggestions: Suggestion[] }> };
  AutocompleteSessionToken: new () => object;
}
type MapsWindow = Window & { google?: { maps: { importLibrary: (name: string) => Promise<unknown> } }; cmMapsReady?: () => void };

let loading: Promise<void> | undefined;
/** Loads Google's Maps JavaScript API once, with the school's key. */
function loadMaps(key: string) {
  const w = window as MapsWindow;
  if (w.google?.maps?.importLibrary) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    w.cmMapsReady = () => resolve();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=cmMapsReady&v=weekly`;
    s.async = true;
    s.onerror = () => {
      loading = undefined;
      reject(new Error('Google Maps could not be loaded. Check the key and your connection.'));
    };
    document.head.append(s);
  });
  return loading;
}

/** Around Electronic City and Begur, so the school's own centres come first. */
const NEAR = { center: { lat: 12.85, lng: 77.65 }, radius: 30000 };

export function MapPlaceField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const { services } = useSession();
  const keyDoc = useDoc<{ key?: string }>(services.db, 'private/maps');
  const key = keyDoc.data?.key?.trim();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion['placePrediction'][]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const token = useRef<object | undefined>(undefined);
  const searchId = useId();
  const place = mapLocation(value);
  const preview = value.trim() ? mapEmbed(place) : undefined;

  // Search as the admin types (after a short pause).
  useEffect(() => {
    if (!key || query.trim().length < 3) {
      setResults([]);
      return;
    }
    let live = true;
    const t = setTimeout(async () => {
      try {
        await loadMaps(key);
        const places = (await (window as MapsWindow).google!.maps.importLibrary('places')) as PlacesLibrary;
        token.current ??= new places.AutocompleteSessionToken();
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken: token.current,
          locationBias: NEAR,
          includedRegionCodes: ['in'],
        });
        if (!live) return;
        const found = suggestions.map((s) => s.placePrediction).filter(Boolean);
        setResults(found);
        setStatus(found.length ? '' : 'Nothing found. Try the name as it appears on Google Maps.');
      } catch (e) {
        if (live) setStatus(errorText(e));
      }
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [key, query]);

  const choose = async (p: NonNullable<Suggestion['placePrediction']>) => {
    setBusy(true);
    try {
      const gp = p.toPlace();
      await gp.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'id'] });
      token.current = undefined; // a new search session after a pick
      if (!gp.location) throw new Error('Google Maps gave no location for this place.');
      onChange(placeLink({ id: gp.id, name: gp.displayName ?? p.text.text, lat: gp.location.lat(), lng: gp.location.lng() }));
      setQuery('');
      setResults([]);
      setStatus(`Chosen: ${gp.displayName ?? p.text.text}${gp.formattedAddress ? `, ${gp.formattedAddress}` : ''}. Save to keep it.`);
    } catch (e) {
      setStatus(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="map-place">
      {key ? (
        <div className="map-place__search">
          <label htmlFor={searchId}>Search Google Maps</label>
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder="Type the centre’s name, e.g. Crossmaze Neotown"
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="map-place__results" role="listbox" aria-label="Places on Google Maps">
              {results.map((r, i) => (
                <li key={i}>
                  <button type="button" disabled={busy} onClick={() => r && void choose(r)}>
                    <b>{r!.text.text.split(',')[0]}</b>
                    <span>{r!.secondaryText?.text ?? r!.text.text.split(',').slice(1).join(',')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        !keyDoc.loading && !keyDoc.error && <MapsKeySetup />
      )}
      {status && <p className="help">{status}</p>}
      <label className="map-place__link" htmlFor={id}>
        Or paste a Google Maps link (or coordinates)
      </label>
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      {preview && (
        <iframe className="map-place__preview" title="Where the map on the centre’s page points" src={preview} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      )}
      {value.trim() && !place.coords && (
        <p className="help">No exact pin in this yet: the page searches Google Maps for it. A place chosen from the search, or a full Google Maps link, gives the exact spot.</p>
      )}
    </div>
  );
}

/** Adding the school's Google Maps key, once (full admins). */
function MapsKeySetup() {
  const { services } = useSession();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const save = async () => {
    try {
      await setDoc(doc(services.db, 'private/maps'), { key: key.trim() });
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <div className="map-place__setup">
      <p className="help">
        To search Google Maps here, add the school’s Google Maps key once. In Google Cloud (the website’s Firebase project), turn on <b>Maps JavaScript API</b> and <b>Places API (New)</b>, create an API key, and
        restrict it to the website (<code>https://www.crossmaze.in/*</code>) and to those two APIs. Then paste it here. Until then, paste a link from Google Maps below.
      </p>
      <div className="map-place__key">
        <input type="password" value={key} placeholder="Google Maps API key" autoComplete="off" onChange={(e) => setKey(e.target.value)} aria-label="Google Maps API key" />
        <button type="button" className="btn btn-sm" disabled={key.trim().length < 20} onClick={() => void save()}>
          Save key
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
