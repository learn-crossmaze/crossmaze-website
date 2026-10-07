import { useEffect, useRef, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { clean, markChanged, same, useDoc } from '../data';
import type { Field } from '../schemas';
import { Icon, SchemaForm, missingRequired } from './fields';
import { ErrorBox, PageHeader, Spinner, errorText, useSession, useToast, useUnsavedWarning } from './ui';

type Obj = Record<string, unknown>;

/** Editor for a single Firestore document, e.g. content/site. */
export function DocEditor({ path, title, intro, schema }: { path: string; title: string; intro: string; schema: Field[] }) {
  const { services, email } = useSession();
  const toast = useToast();
  const { data, loading, error } = useDoc<Obj>(services.db, path);
  const [draft, setDraft] = useState<Obj | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = draft !== null && !same(draft, data ?? {});
  useUnsavedWarning(dirty);

  // Follow the stored document until the editor starts changing things.
  const synced = useRef<Obj | undefined>(undefined);
  useEffect(() => {
    if (loading) return;
    setDraft((current) => (current === null || same(current, synced.current ?? {}) ? (data ?? {}) : current));
    synced.current = data;
  }, [data, loading]);

  const save = async () => {
    if (!draft) return;
    const missing = missingRequired(schema, draft);
    if (missing.length) {
      toast('error', `Please fill in: ${missing.join(', ')}`);
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(services.db, path), clean(draft));
      await markChanged(services.db, email);
      toast('ok', 'Saved. Press Publish when you’re ready to update the website.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        intro={intro}
        actions={
          <>
            {dirty && (
              <button className="btn btn-light" onClick={() => setDraft(data ?? {})}>
                Discard changes
              </button>
            )}
            <button className="btn" disabled={!dirty || saving} onClick={save}>
              <Icon name="Save" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      />
      {error && <ErrorBox>{errorText(error)}</ErrorBox>}
      {loading || !draft ? (
        <Spinner />
      ) : !data ? (
        <ErrorBox>
          This content hasn’t been set up yet. It is copied from the website automatically the first time the site is published
          with the GitHub deploy (see README, “Admin panel setup”).
        </ErrorBox>
      ) : (
        <div className="card">
          <SchemaForm fields={schema} value={draft} onChange={setDraft} />
        </div>
      )}
      {dirty && (
        <div className="savebar">
          <span>You have unsaved changes.</span>
          <button className="btn" disabled={saving} onClick={save}>
            <Icon name="Save" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </>
  );
}
