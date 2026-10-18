// Branch admins: the centre head's name, photo and biography on their branch pages, and the branch's
// timings and batches. Saving changes only `centerHead` and `batches`, which is all the security rules
// let a branch admin change.
import { useContext, useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { clean, markChanged, same, useDoc, useImageUrl } from '../data';
import { batchesField, centerHeadFields } from '../schemas';
import { FormContext, Icon, SchemaForm, formProblem } from './fields';
import { ErrorBox, PageHeader, SITE_URL, Spinner, errorText, useSession, useToast, useUnsavedWarning } from './ui';

type Head = { name: string; photo: string; bio: string[] };
interface Branch {
  name?: string;
  area?: string;
  centerHead?: Partial<Head>;
  batches?: unknown[];
  programs?: string[];
}

const headOf = (branch?: Branch): Head => ({
  name: String(branch?.centerHead?.name ?? ''),
  photo: String(branch?.centerHead?.photo ?? ''),
  bio: Array.isArray(branch?.centerHead?.bio) ? branch.centerHead.bio.map(String) : [],
});

export function CentreHeadPage({ id }: { id?: string }) {
  const { branches } = useSession();
  if (branches.length === 0)
    return <ErrorBox>You haven’t been given a branch yet. Ask an admin to tick your branch on the Admins page.</ErrorBox>;
  const slug = id ?? (branches.length === 1 ? branches[0] : undefined);
  if (!slug) return <BranchChooser />;
  if (!branches.includes(slug)) return <ErrorBox>That branch isn’t one of yours.</ErrorBox>;
  return <CentreHeadLoader key={slug} slug={slug} several={branches.length > 1} />;
}

function BranchChooser() {
  const { branches } = useSession();
  return (
    <>
      <PageHeader title="Your branches" intro="The centre head’s profile and the timings and batches on each of your branch pages." />
      <ul className="item-list">
        {branches.map((slug) => (
          <BranchRow key={slug} slug={slug} />
        ))}
      </ul>
    </>
  );
}

function BranchRow({ slug }: { slug: string }) {
  const { services } = useSession();
  const { data } = useDoc<Branch>(services.db, `branches/${slug}`);
  const head = headOf(data);
  const photo = useImageUrl(services, head.photo || undefined);
  return (
    <li>
      <span className="list-thumb">{photo ? <img src={photo} alt="" /> : null}</span>
      <a className="item-main" href={`#/centre/${slug}`}>
        <strong>{data?.name ?? slug}</strong>
        <span>{head.name || 'No centre head yet'}</span>
      </a>
      <span className="row-actions">
        <a className="btn btn-light btn-sm" href={`#/centre/${slug}`}>
          Edit
        </a>
      </span>
    </li>
  );
}

function CentreHeadLoader({ slug, several }: { slug: string; several: boolean }) {
  const { services } = useSession();
  const { data, loading, error } = useDoc<Branch>(services.db, `branches/${slug}`);
  if (error) return <ErrorBox>{errorText(error)}</ErrorBox>;
  if (loading) return <Spinner />;
  if (!data) return <ErrorBox>This branch isn’t on the website any more. Ask an admin to update your branches.</ErrorBox>;
  return <CentreHeadEditor slug={slug} branch={data} several={several} />;
}

function CentreHeadEditor({ slug, branch, several }: { slug: string; branch: Branch; several: boolean }) {
  const { services, email } = useSession();
  const toast = useToast();
  const stored = { ...headOf(branch), batches: Array.isArray(branch.batches) ? branch.batches : [] };
  const [draft, setDraft] = useState<Record<string, unknown>>(stored);
  const [saving, setSaving] = useState(false);
  const dirty = !same(draft, stored);
  useUnsavedWarning(dirty);

  // Batches can only be for the programs this branch offers (the site leaves out any others).
  const form = useContext(FormContext)!;
  const offered = useMemo(
    () => ({ ...form, programOptions: form.programOptions.filter((o) => !branch.programs || branch.programs.includes(o.value)) }),
    [form, branch.programs],
  );

  const save = async () => {
    const problem = formProblem([batchesField, ...centerHeadFields], draft);
    if (problem) {
      toast('error', problem);
      return;
    }
    setSaving(true);
    try {
      const { batches, ...head } = clean(draft);
      const { name, photo, bio } = headOf({ centerHead: head });
      await updateDoc(doc(services.db, 'branches', slug), {
        centerHead: { name: name.trim(), photo, bio },
        batches: Array.isArray(batches) ? batches : [],
      });
      await markChanged(services.db, email);
      toast('ok', 'Saved. Press Publish when you’re ready to update the website.');
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const pageUrl = `${SITE_URL}/branch/${slug}`;

  return (
    <>
      <PageHeader
        title={branch.name ? branch.name.replace(/^Crossmaze\s*[–-]?\s*/i, '') : 'Your branch'}
        back={several ? { href: '#/centre', label: 'Your branches' } : undefined}
        intro={
          <>
            Shown on the branch page,{' '}
            <a href={pageUrl} target="_blank" rel="noopener">
              {pageUrl.replace(/^https?:\/\//, '')} <Icon name="ExternalLink" size={14} />
            </a>
            . Leave the centre head’s name empty to hide that part of the page.
          </>
        }
        actions={
          <button className="btn" disabled={!dirty || saving} onClick={save}>
            <Icon name="Save" /> {saving ? 'Saving…' : 'Save'}
          </button>
        }
      />
      <h2 className="section-title first">Timings and batches</h2>
      <div className="card">
        <FormContext.Provider value={offered}>
          <SchemaForm fields={[batchesField]} value={draft} onChange={setDraft} />
        </FormContext.Provider>
      </div>
      <h2 className="section-title">Centre head</h2>
      <div className="card">
        <SchemaForm fields={centerHeadFields} value={draft} onChange={setDraft} />
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
