import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './admin.css';
import { useCollection, useFirebase, useUser } from './data';
import type { FirebaseServices } from './firebase';
import { collections, siteSchema, sectionsSchema } from './schemas';
import { FormContext, Icon } from './components/fields';
import { ErrorBox, SessionContext, Spinner, ToastProvider, errorText, useSession } from './components/ui';
import { CollectionPage } from './components/CollectionEditor';
import { DocEditor } from './components/DocEditor';
import { Dashboard, PublishButton } from './components/Dashboard';
import { SubmissionsPage } from './components/Submissions';
import { LitmusPage } from './components/Litmus';
import { AdminsPage } from './components/Admins';

const NAV = [
  { href: '#/', icon: 'LayoutDashboard', label: 'Dashboard' },
  { href: '#/site', icon: 'Settings', label: 'Site settings' },
  { href: '#/branches', icon: 'Building', label: 'Branches' },
  { href: '#/programs', icon: 'BookMarked', label: 'Programs' },
  { href: '#/jobs', icon: 'Briefcase', label: 'Jobs' },
  { href: '#/testimonials', icon: 'Quote', label: 'Testimonials' },
  { href: '#/sections', icon: 'LayoutList', label: 'Page sections' },
  { href: '#/submissions', icon: 'Inbox', label: 'Submissions' },
  { href: '#/litmus', icon: 'Plug', label: 'LITMUS' },
  { href: '#/admins', icon: 'UserCog', label: 'Admins' },
];

function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [route, setRoute] = useState<string[]>(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export default function AdminApp() {
  const { services, error } = useFirebase();
  const user = useUser(services);

  if (error)
    return (
      <Centered>
        <ErrorBox>{error}</ErrorBox>
      </Centered>
    );
  if (!services || user === undefined)
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  if (!user) return <Login services={services} />;
  return <Gate services={services} user={user} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="centered">
      <div className="login-card">
        <img src="/logo.png" alt="Crossmaze" className="login-logo" />
        {children}
      </div>
    </div>
  );
}

/** Checks that the signed-in person has a verified email that is on the admin list. */
function Gate({ services, user }: { services: FirebaseServices; user: User }) {
  const [state, setState] = useState<'checking' | 'admin' | 'denied' | 'unverified'>('checking');
  const email = (user.email ?? '').toLowerCase();

  const check = async () => {
    setState('checking');
    await user.reload();
    if (!user.emailVerified) return setState('unverified');
    await user.getIdToken(true);
    try {
      const snap = await getDoc(doc(services.db, 'admins', email));
      setState(snap.exists() ? 'admin' : 'denied');
    } catch {
      setState('denied');
    }
  };

  useEffect(() => {
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  if (state === 'checking')
    return (
      <Centered>
        <Spinner label="Checking access…" />
      </Centered>
    );
  if (state === 'unverified')
    return (
      <Centered>
        <h1>Verify your email</h1>
        <p>
          We sent a link to <strong>{user.email}</strong>. Click it, then come back here.
        </p>
        <div className="stack">
          <button className="btn" onClick={check}>
            I’ve verified my email
          </button>
          <button className="btn btn-light" onClick={() => sendEmailVerification(user).then(() => alert('Sent. Check your inbox and spam folder.'))}>
            Send the link again
          </button>
          <button className="btn btn-light" onClick={() => signOut(services.auth)}>
            Sign out
          </button>
        </div>
      </Centered>
    );
  if (state === 'denied')
    return (
      <Centered>
        <h1>No access yet</h1>
        <p>
          <strong>{user.email}</strong> isn’t on the admin list. Ask an existing admin to add this email on the Admins page, then
          try again.
        </p>
        <div className="stack">
          <button className="btn" onClick={check}>
            Try again
          </button>
          <button className="btn btn-light" onClick={() => signOut(services.auth)}>
            Sign out
          </button>
        </div>
      </Centered>
    );

  return (
    <SessionContext.Provider value={{ services, user, email }}>
      <ToastProvider>
        <FormProvider>
          <Shell />
        </FormProvider>
      </ToastProvider>
    </SessionContext.Provider>
  );
}

/** Shared data for the editors: Firebase services and the program list for "programs offered". */
function FormProvider({ children }: { children: ReactNode }) {
  const { services } = useSession();
  const programs = useCollection<{ slug?: string; name?: string }>(services.db, 'programs');
  const value = useMemo(
    () => ({
      services,
      programOptions: programs.items.map((p) => ({ value: String(p.slug ?? p.id), label: String(p.name ?? p.id) })),
    }),
    [services, programs.items],
  );
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

/** Keeps one broken page from blanking the whole admin panel. */
class PageBoundary extends Component<{ children: ReactNode; resetKey: string }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: undefined });
  }
  render() {
    return this.state.error ? (
      <ErrorBox>
        Something went wrong on this page: {this.state.error.message}. Reload the page, and if it keeps happening, tell your web
        developer.
      </ErrorBox>
    ) : (
      this.props.children
    );
  }
}

function Shell() {
  const { services, email } = useSession();
  const route = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [section = '', id] = route;
  useEffect(() => setMenuOpen(false), [section, id]);

  const page = (() => {
    switch (section) {
      case '':
        return <Dashboard />;
      case 'site':
        return (
          <DocEditor
            path="content/site"
            title="Site settings"
            intro="Logo, contact details and the main text on the home and about pages."
            schema={siteSchema}
          />
        );
      case 'sections':
        return (
          <DocEditor
            path="content/sections"
            title="Page sections"
            intro="Lists that appear on several pages: core values, teaching approach, facilities, perks and FAQs."
            schema={sectionsSchema}
          />
        );
      case 'branches':
      case 'programs':
      case 'jobs':
      case 'testimonials':
        return <CollectionPage key={section} config={collections[section]} id={id} />;
      case 'submissions':
        return <SubmissionsPage id={id} />;
      case 'litmus':
        return <LitmusPage />;
      case 'admins':
        return <AdminsPage />;
      default:
        return <ErrorBox>Page not found.</ErrorBox>;
    }
  })();

  return (
    <div className={`shell ${menuOpen ? 'menu-open' : ''}`}>
      <aside className="sidebar">
        <a className="brand" href="#/">
          <img src="/logo.png" alt="Crossmaze" />
          <span>Website admin</span>
        </a>
        <nav aria-label="Admin">
          {NAV.map((n) => {
            const active = n.href === '#/' ? section === '' : `#/${section}` === n.href;
            return (
              <a key={n.href} href={n.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                <Icon name={n.icon} />
                {n.label}
              </a>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <a href="/" target="_blank" rel="noopener">
            <Icon name="ExternalLink" /> View website
          </a>
          <button onClick={() => signOut(services.auth)}>
            <Icon name="LogOut" /> Sign out
          </button>
          <span className="who">{email}</span>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="icon-btn menu-btn" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? 'X' : 'Menu'} size={22} />
          </button>
          <span className="topbar-title">Crossmaze admin</span>
          <PublishButton compact />
        </div>
        <main className="content">
          <PageBoundary resetKey={route.join('/')}>{page}</PageBoundary>
        </main>
      </div>
    </div>
  );
}

const LOGIN_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Choose a password of at least 6 characters.',
  'auth/popup-closed-by-user': 'The Google window was closed before signing in.',
  'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/operation-not-allowed': 'This sign-in method isn’t switched on in Firebase (Authentication → Sign-in method).',
  'auth/unauthorized-domain': 'This web address isn’t allowed to sign in. Add it in Firebase → Authentication → Settings → Authorized domains.',
};

function Login({ services }: { services: FirebaseServices }) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string }>();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    setMessage(undefined);
    try {
      await fn();
      if (ok) setMessage({ kind: 'ok', text: ok });
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      const text = LOGIN_ERRORS[code] ?? errorText(e);
      setMessage({ kind: 'error', text });
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === 'reset') return run(() => sendPasswordResetEmail(services.auth, email), 'Check your inbox for a link to set a new password.');
    if (mode === 'signup')
      return run(async () => {
        const cred = await createUserWithEmailAndPassword(services.auth, email, password);
        await sendEmailVerification(cred.user);
      });
    return run(() => signInWithEmailAndPassword(services.auth, email, password));
  };

  return (
    <Centered>
      <h1>{mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Sign in'}</h1>
      <p className="muted">Crossmaze website admin</p>
      {mode !== 'reset' && (
        <>
          <button className="btn btn-google" disabled={busy} onClick={() => run(() => signInWithPopup(services.auth, new GoogleAuthProvider()))}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
            </svg>
            Continue with Google
          </button>
          <div className="or">or</div>
        </>
      )}
      <form onSubmit={submit} className="login-form">
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== 'reset' && (
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        {message && <p className={message.kind === 'ok' ? 'ok-text' : 'error-text'}>{message.text}</p>}
        <button className="btn" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
        </button>
      </form>
      <div className="login-links">
        {mode === 'signin' ? (
          <>
            <button onClick={() => setMode('reset')}>Forgot password?</button>
            <button onClick={() => setMode('signup')}>Create an account</button>
          </>
        ) : (
          <button onClick={() => setMode('signin')}>Back to sign in</button>
        )}
      </div>
    </Centered>
  );
}
