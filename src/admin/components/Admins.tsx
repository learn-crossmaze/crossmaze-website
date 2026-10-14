import { useState } from 'react';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useCollection } from '../data';
import { Icon } from './fields';
import { ErrorBox, PageHeader, Spinner, errorText, formatDate, useSession, useToast } from './ui';

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function AdminsPage() {
  const { services, email } = useSession();
  const toast = useToast();
  const { items, loading, error } = useCollection<{ email?: string; addedBy?: string; addedAt?: unknown }>(services.db, 'admins');
  const [newEmail, setNewEmail] = useState('');

  const add = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = newEmail.trim().toLowerCase();
    if (!validEmail(value)) return toast('error', 'Enter a valid email address.');
    try {
      await setDoc(doc(services.db, 'admins', value), { email: value, addedBy: email, addedAt: serverTimestamp() });
      setNewEmail('');
      toast('ok', `${value} can now sign in to the admin panel.`);
    } catch (err) {
      toast('error', errorText(err));
    }
  };

  if (error) return <ErrorBox>{errorText(error)}</ErrorBox>;
  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Admins"
        intro="People who can sign in to this admin panel. They sign in with Google, or with an email and password and then verify their email."
      />
      <h2 className="section-title first">Full admins</h2>
      <p className="muted">Can change everything, including this list.</p>
      <form className="card add-admin" onSubmit={add}>
        <label htmlFor="admin-email">Add an admin</label>
        <div className="input-with-btn">
          <input id="admin-email" type="email" placeholder="name@crossmaze.in" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <button className="btn">
            <Icon name="Plus" /> Add
          </button>
        </div>
      </form>
      <ul className="item-list">
        {items.map((a) => (
          <li key={a.id}>
            <span className="item-main">
              <strong>
                {a.id}
                {a.id === email && <span className="chip">You</span>}
              </strong>
              <span>{a.addedBy ? `Added by ${a.addedBy} · ${formatDate(a.addedAt)}` : ''}</span>
            </span>
            {a.id !== email && (
              <button
                className="btn btn-light btn-sm danger"
                onClick={async () => {
                  if (!confirm(`Remove ${a.id} from the admin panel?`)) return;
                  await deleteDoc(doc(services.db, 'admins', a.id)).catch((err) => toast('error', errorText(err)));
                }}
              >
                <Icon name="Trash2" size={16} /> Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      <BranchAdmins admins={items.map((a) => a.id)} />
    </>
  );
}

interface BranchAdmin {
  email?: string;
  branches?: string[];
  addedBy?: string;
  addedAt?: unknown;
}

/** Branch admins: their own blog posts, the centre head of the branches ticked here, and Publish. */
function BranchAdmins({ admins }: { admins: string[] }) {
  const { services, email } = useSession();
  const toast = useToast();
  const { items, loading, error } = useCollection<BranchAdmin>(services.db, 'branchAdmins');
  const branchList = useCollection<{ name?: string }>(services.db, 'branches');
  const options = branchList.items.map((b) => ({ value: b.id, label: String(b.name ?? b.id) }));
  const nameOf = (slug: string) => options.find((o) => o.value === slug)?.label ?? slug;
  const [newEmail, setNewEmail] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ id: string; branches: string[] }>();

  const add = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = newEmail.trim().toLowerCase();
    if (!validEmail(value)) return toast('error', 'Enter a valid email address.');
    if (admins.includes(value)) return toast('error', `${value} is already a full admin.`);
    try {
      await setDoc(doc(services.db, 'branchAdmins', value), { email: value, branches: picked, addedBy: email, addedAt: serverTimestamp() });
      setNewEmail('');
      setPicked([]);
      toast('ok', `${value} can now sign in as a branch admin.`);
    } catch (err) {
      toast('error', errorText(err));
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateDoc(doc(services.db, 'branchAdmins', editing.id), { branches: editing.branches });
      setEditing(undefined);
      toast('ok', 'Saved. The change applies the next time they sign in.');
    } catch (err) {
      toast('error', errorText(err));
    }
  };

  return (
    <>
      <h2 className="section-title">Branch admins</h2>
      <p className="muted">
        Can write blog posts and publish them, and update the centre head’s name, photo and biography for the branches ticked here.
        They can’t see enquiries, calls or anything else, and can only change their own posts.
      </p>
      {error ? (
        <ErrorBox>
          {error.includes('permission')
            ? 'Branch admins need the latest database rules. Run “npx firebase-tools deploy --only firestore,storage,functions” (README, step 3), then reload this page.'
            : errorText(error)}
        </ErrorBox>
      ) : loading ? (
        <Spinner />
      ) : (
        <>
          <form className="card add-admin" onSubmit={add}>
            <label htmlFor="branch-admin-email">Add a branch admin</label>
            <input id="branch-admin-email" type="email" placeholder="name@crossmaze.in" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <span className="add-admin-sub">Centre head they look after</span>
            <BranchChecks options={options} value={picked} onChange={setPicked} />
            <button className="btn">
              <Icon name="Plus" /> Add branch admin
            </button>
          </form>
          {items.length > 0 && (
            <ul className="item-list">
              {items.map((a) => {
                const branches = Array.isArray(a.branches) ? a.branches : [];
                const open = editing?.id === a.id;
                return (
                  <li key={a.id} className={open ? 'editing' : ''}>
                    <span className="item-main">
                      <strong>
                        {a.id}
                        {admins.includes(a.id) && <span className="chip">Also a full admin</span>}
                      </strong>
                      <span>
                        {branches.length ? branches.map(nameOf).join(', ') : 'Blog only'}
                        {a.addedBy ? ` · Added by ${a.addedBy} · ${formatDate(a.addedAt)}` : ''}
                      </span>
                    </span>
                    <span className="row-actions">
                      {!open && (
                        <button className="btn btn-light btn-sm" onClick={() => setEditing({ id: a.id, branches })}>
                          <Icon name="Pencil" size={16} /> Branches
                        </button>
                      )}
                      <button
                        className="btn btn-light btn-sm danger"
                        onClick={async () => {
                          if (!confirm(`Remove ${a.id} as a branch admin? Their blog posts stay.`)) return;
                          await deleteDoc(doc(services.db, 'branchAdmins', a.id)).catch((err) => toast('error', errorText(err)));
                        }}
                      >
                        <Icon name="Trash2" size={16} /> Remove
                      </button>
                    </span>
                    {open && (
                      <div className="branch-edit">
                        <BranchChecks options={options} value={editing.branches} onChange={(list) => setEditing({ id: a.id, branches: list })} />
                        <div className="stack-row">
                          <button className="btn btn-sm" onClick={saveEdit}>
                            <Icon name="Save" size={16} /> Save
                          </button>
                          <button className="btn btn-light btn-sm" onClick={() => setEditing(undefined)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}

function BranchChecks({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="checks">
      {options.map((o) => (
        <label key={o.value} className="check">
          <input
            type="checkbox"
            checked={value.includes(o.value)}
            onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
