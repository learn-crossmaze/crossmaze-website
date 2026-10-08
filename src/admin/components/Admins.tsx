import { useState } from 'react';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useCollection } from '../data';
import { Icon } from './fields';
import { ErrorBox, PageHeader, Spinner, errorText, formatDate, useSession, useToast } from './ui';

export function AdminsPage() {
  const { services, email } = useSession();
  const toast = useToast();
  const { items, loading, error } = useCollection<{ email?: string; addedBy?: string; addedAt?: unknown }>(services.db, 'admins');
  const [newEmail, setNewEmail] = useState('');

  const add = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return toast('error', 'Enter a valid email address.');
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
    </>
  );
}
