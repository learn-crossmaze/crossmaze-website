import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { clean, markChanged, same, useCollection, useImageUrl, type WithId } from '../data';
import { slugify, type CollectionConfig } from '../schemas';
import { Icon, SchemaForm, forStorage, formProblem } from './fields';
import { ErrorBox, PageHeader, SITE_URL, Spinner, errorText, useSession, useToast, useUnsavedWarning } from './ui';

type Obj = Record<string, unknown>;
type Item = WithId<Obj>;

function coverOf(item: Obj): string | undefined {
  if (Array.isArray(item.photos) && typeof item.photos[0] === 'string') return item.photos[0];
  if (typeof item.photo === 'string') return item.photo;
  if (typeof item.cover === 'string') return item.cover;
  return undefined;
}

/** Newest first by the "date" field (YYYY-MM-DD), for collections sorted by date. */
const byDate = (a: Item, b: Item) => String(b.date ?? '').localeCompare(String(a.date ?? ''));

function ListThumb({ path }: { path?: string }) {
  const { services } = useSession();
  const url = useImageUrl(services, path);
  return <span className="list-thumb">{url ? <img src={url} alt="" /> : null}</span>;
}

export function CollectionPage({ config, id }: { config: CollectionConfig; id?: string }) {
  const { services, email, role } = useSession();
  // Branch admins can only list their own blog posts.
  const own = role === 'branch' && config.owned ? { field: 'createdBy', value: email } : undefined;
  const { items, loading, error } = useCollection<Obj>(services.db, config.name, own);

  if (error) return <ErrorBox>{errorText(error)}</ErrorBox>;
  if (loading) return <Spinner />;
  if (id === 'new') return <CreateItem config={config} items={items} />;
  if (id) {
    const item = items.find((i) => i.id === id);
    if (!item)
      return <ErrorBox>{own ? `That ${config.singular} doesn’t exist, or someone else wrote it.` : `That ${config.singular} doesn’t exist any more.`}</ErrorBox>;
    return <ItemEditor key={item.id} config={config} item={item} />;
  }
  return <ItemList config={config} items={items} />;
}

function ItemList({ config, items: stored }: { config: CollectionConfig; items: Item[] }) {
  const { services, email, role } = useSession();
  const toast = useToast();
  const byHand = config.sort !== 'date';
  const items = byHand ? stored : [...stored].sort(byDate);

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
        intro={
          (role === 'branch' && config.owned ? `Only your own ${config.title.toLowerCase()} posts are listed here. ` : '') +
          (config.listIntro ?? `The order here is the order on the website. Hidden ${config.title.toLowerCase()} are kept but not shown.`)
        }
        actions={
          <a className="btn" href={`#/${config.name}/new`}>
            <Icon name="Plus" /> Add {config.singular}
          </a>
        }
      />
      {items.length === 0 ? (
        <div className="card empty">
          {role === 'branch' && config.owned ? `You haven’t written any ${config.singular}s yet.` : `No ${config.title.toLowerCase()} yet.`}
        </div>
      ) : (
        <ul className="item-list">
          {items.map((item, i) => (
            <li key={item.id} className={item.hidden ? 'is-hidden' : ''}>
              {config.name !== 'testimonials' && config.name !== 'jobs' && <ListThumb path={coverOf(item)} />}
              <a className="item-main" href={`#/${config.name}/${item.id}`}>
                <strong>{String(item[config.titleField] || '(untitled)')}</strong>
                {config.subtitle ? (
                  <span>
                    {config.subtitle(item)}
                    {typeof item.createdBy === 'string' && item.createdBy !== email && ` · by ${item.createdBy}`}
                  </span>
                ) : (
                  config.subtitleField && <span>{String(item[config.subtitleField] ?? '')}</span>
                )}
              </a>
              {item.hidden === true && <span className="chip">Hidden</span>}
              <span className="row-actions">
                {byHand && (
                  <>
                    <button className="icon-btn" title="Move up" aria-label="Move up" disabled={i === 0} onClick={() => reorder(i, i - 1)}>
                      <Icon name="ArrowUp" size={16} />
                    </button>
                    <button className="icon-btn" title="Move down" aria-label="Move down" disabled={i === items.length - 1} onClick={() => reorder(i, i + 1)}>
                      <Icon name="ArrowDown" size={16} />
                    </button>
                  </>
                )}
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
  const { services, email, role } = useSession();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slugEdited && config.slug) {
      // Branch addresses already start with "crossmaze-", so don't repeat it.
      const base = slugify(config.slug.prefix.startsWith('crossmaze') ? title.replace(/^crossmaze\s*[–-]?\s*/i, '') : title);
      setSlug(base ? `${config.slug.prefix}${base}` : '');
    }
  }, [title, slugEdited, config.slug]);

  const create = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const order = items.reduce((max, i) => Math.max(max, Number(i.order) || 0), -1) + 1;
      const data = { ...config.blank(), [config.titleField]: title.trim(), order, ...(config.owned ? { createdBy: email } : {}) };
      let id: string;
      if (config.slug) {
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error('The web address can only use lower-case letters, numbers and dashes.');
        const taken = await getDoc(doc(services.db, config.name, slug)).then(
          (d) => d.exists(),
          (err: { code?: string }) => {
            // Branch admins can't open other people's posts, so an address they can't check is taken.
            if (role === 'branch' && err.code === 'permission-denied') return true;
            throw err;
          },
        );
        if (taken) throw new Error('That web address is already used.');
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
  const dirty = !same(forStorage(config.schema, draft, true), forStorage(config.schema, stored, true));
  useUnsavedWarning(dirty);

  const save = async () => {
    const problem = formProblem(config.schema, draft);
    if (problem) {
      toast('error', problem);
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(services.db, config.name, id), clean(forStorage(config.schema, draft)));
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
  const previewPath = stored.hidden === true ? config.previewPath?.(stored) : undefined;

  return (
    <>
      <PageHeader
        title={String(draft[config.titleField] || `Untitled ${config.singular}`)}
        back={{ href: `#/${config.name}`, label: config.title }}
        intro={
          previewPath ? (
            <>
              Hidden. Private preview (shows the version from your last Publish):{' '}
              <a href={`${SITE_URL}${previewPath}`} target="_blank" rel="noopener">
                Open preview <Icon name="ExternalLink" size={14} />
              </a>
            </>
          ) : (
            liveUrl && (
              <a href={liveUrl} target="_blank" rel="noopener">
                {liveUrl.replace(/^https?:\/\//, '')} <Icon name="ExternalLink" size={14} />
              </a>
            )
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
