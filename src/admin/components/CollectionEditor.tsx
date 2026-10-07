import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { clean, markChanged, same, useCollection, useImageUrl, type WithId } from '../data';
import { slugify, type CollectionConfig } from '../schemas';
import { Icon, SchemaForm, missingRequired } from './fields';
import { ErrorBox, PageHeader, Spinner, errorText, useSession, useToast, useUnsavedWarning } from './ui';

type Obj = Record<string, unknown>;
type Item = WithId<Obj>;

const SITE_URL = 'https://www.crossmaze.in';

function coverOf(item: Obj): string | undefined {
  if (Array.isArray(item.photos) && typeof item.photos[0] === 'string') return item.photos[0];
  if (typeof item.photo === 'string') return item.photo;
  return undefined;
}

function ListThumb({ path }: { path?: string }) {
  const { services } = useSession();
  const url = useImageUrl(services, path);
  return <span className="list-thumb">{url ? <img src={url} alt="" /> : null}</span>;
}

export function CollectionPage({ config, id }: { config: CollectionConfig; id?: string }) {
  const { services } = useSession();
  const { items, loading, error } = useCollection<Obj>(services.db, config.name);

  if (error) return <ErrorBox>{errorText(error)}</ErrorBox>;
  if (loading) return <Spinner />;
  if (id === 'new') return <CreateItem config={config} items={items} />;
  if (id) {
    const item = items.find((i) => i.id === id);
    if (!item) return <ErrorBox>That {config.singular} doesn’t exist any more.</ErrorBox>;
    return <ItemEditor key={item.id} config={config} item={item} />;
  }
  return <ItemList config={config} items={items} />;
}

function ItemList({ config, items }: { config: CollectionConfig; items: Item[] }) {
  const { services, email } = useSession();
  const toast = useToast();

  const reorder = async (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const list = [...items];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved!);
    const batch = writeBatch(services.db);
    list.forEach((item, order) => batch.update(doc(services.db, config.name, item.id), { order }));
    try {
      await batch.commit();
      await markChanged(services.db, email);
    } catch (e) {
      toast('error', errorText(e));
    }
  };

  return (
    <>
      <PageHeader
        title={config.title}
        intro={`The order here is the order on the website. Hidden ${config.title.toLowerCase()} are kept but not shown.`}
        actions={
          <a className="btn" href={`#/${config.name}/new`}>
            <Icon name="Plus" /> Add {config.singular}
          </a>
        }
      />
      {items.length === 0 ? (
        <div className="card empty">No {config.title.toLowerCase()} yet.</div>
      ) : (
        <ul className="item-list">
          {items.map((item, i) => (
            <li key={item.id} className={item.hidden ? 'is-hidden' : ''}>
              {config.name !== 'testimonials' && config.name !== 'jobs' && <ListThumb path={coverOf(item)} />}
              <a className="item-main" href={`#/${config.name}/${item.id}`}>
                <strong>{String(item[config.titleField] || '(untitled)')}</strong>
                {config.subtitleField && <span>{String(item[config.subtitleField] ?? '')}</span>}
              </a>
              {item.hidden === true && <span className="chip">Hidden</span>}
              <span className="row-actions">
                <button className="icon-btn" title="Move up" aria-label="Move up" disabled={i === 0} onClick={() => reorder(i, i - 1)}>
                  <Icon name="ArrowUp" size={16} />
                </button>
                <button className="icon-btn" title="Move down" aria-label="Move down" disabled={i === items.length - 1} onClick={() => reorder(i, i + 1)}>
                  <Icon name="ArrowDown" size={16} />
                </button>
                <a className="btn btn-light btn-sm" href={`#/${config.name}/${item.id}`}>
                  Edit
                </a>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CreateItem({ config, items }: { config: CollectionConfig; items: Item[] }) {
  const { services, email } = useSession();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slugEdited && config.slug) {
      const base = slugify(title.replace(/^crossmaze\s*[–-]?\s*/i, ''));
      setSlug(base ? `${config.slug.prefix}${base}` : '');
    }
  }, [title, slugEdited, config.slug]);

  const create = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const order = items.reduce((max, i) => Math.max(max, Number(i.order) || 0), -1) + 1;
      const data = { ...config.blank(), [config.titleField]: title.trim(), order };
      let id: string;
      if (config.slug) {
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error('The web address can only use lower-case letters, numbers and dashes.');
        if ((await getDoc(doc(services.db, config.name, slug))).exists()) throw new Error('That web address is already used.');
        await setDoc(doc(services.db, config.name, slug), { ...data, slug, hidden: true });
        id = slug;
      } else {
        id = (await addDoc(collection(services.db, config.name), { ...data, hidden: true })).id;
      }
      await markChanged(services.db, email);
      toast('ok', `Created. It stays hidden until you untick “Hide from website”.`);
      window.location.hash = `#/${config.name}/${id}`;
    } catch (err) {
      toast('error', errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={`New ${config.singular}`} back={{ href: `#/${config.name}`, label: config.title }} />
      <form className="card narrow" onSubmit={create}>
        <div className="field">
          <label htmlFor="new-title">{config.titleField === 'title' ? 'Title' : 'Name'}</label>
          <input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </div>
        {config.slug && (
          <div className="field">
            <label htmlFor="new-slug">Web address</label>
            <div className="slug-input">
              <span>{config.slug.urlPrefix ?? '#'}</span>
              <input
                id="new-slug"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(slugify(e.target.value));
                }}
                required
              />
            </div>
            <p className="help">This can’t be changed later, so links to it keep working.</p>
          </div>
        )}
        <button className="btn" disabled={busy}>
          <Icon name="Plus" /> Create {config.singular}
        </button>
      </form>
    </>
  );
}

function ItemEditor({ config, item }: { config: CollectionConfig; item: Item }) {
  const { services, email } = useSession();
  const toast = useToast();
  const { id, ...stored } = item;
  const [draft, setDraft] = useState<Obj>(stored);
  const [saving, setSaving] = useState(false);
  const dirty = !same(draft, stored);
  useUnsavedWarning(dirty);

  const save = async () => {
    const missing = missingRequired(config.schema, draft);
    if (missing.length) {
      toast('error', `Please fill in: ${missing.join(', ')}`);
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(services.db, config.name, id), clean(draft));
      await markChanged(services.db, email);
      toast('ok', 'Saved. Press Publish when you’re ready to update the website.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const name = String(stored[config.titleField] || `this ${config.singular}`);
    if (!confirm(`Delete ${name}? This can’t be undone. (Tip: tick “Hide from website” instead to keep it.)`)) return;
    try {
      await deleteDoc(doc(services.db, config.name, id));
      await markChanged(services.db, email);
      toast('ok', 'Deleted.');
      window.location.hash = `#/${config.name}`;
    } catch (e) {
      toast('error', errorText(e));
    }
  };

  const liveUrl = config.slug?.urlPrefix ? `${SITE_URL}${config.slug.urlPrefix}${id}` : undefined;

  return (
    <>
      <PageHeader
        title={String(draft[config.titleField] || `Untitled ${config.singular}`)}
        back={{ href: `#/${config.name}`, label: config.title }}
        intro={
          liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener">
              {liveUrl.replace('https://', '')} <Icon name="ExternalLink" size={14} />
            </a>
          )
        }
        actions={
          <>
            <button className="btn btn-light danger" onClick={remove}>
              <Icon name="Trash2" /> Delete
            </button>
            <button className="btn" disabled={!dirty || saving} onClick={save}>
              <Icon name="Save" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      />
      <div className="card">
        <label className="check hide-toggle">
          <input type="checkbox" checked={draft.hidden === true} onChange={(e) => setDraft({ ...draft, hidden: e.target.checked })} />
          Hide from website
        </label>
        <SchemaForm fields={config.schema} value={draft} onChange={setDraft} />
      </div>
      {dirty && (
        <div className="savebar">
          <span>You have unsaved changes.</span>
          <button className="btn btn-light" onClick={() => setDraft(stored)}>
            Discard
          </button>
          <button className="btn" disabled={saving} onClick={save}>
            <Icon name="Save" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </>
  );
}
