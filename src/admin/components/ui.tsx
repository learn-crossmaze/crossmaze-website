import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { FirebaseServices } from '../firebase';
import { Icon } from './fields';

export interface Session {
  services: FirebaseServices;
  user: User;
  email: string;
}
export const SessionContext = createContext<Session | null>(null);
export function useSession() {
  const s = useContext(SessionContext);
  if (!s) throw new Error('SessionContext missing');
  return s;
}

type Toast = { id: number; kind: 'ok' | 'error'; text: string };
const ToastContext = createContext<(kind: Toast['kind'], text: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 8000 : 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <Icon name={t.kind === 'ok' ? 'CircleCheck' : 'CircleAlert'} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function PageHeader({ title, intro, actions, back }: { title: string; intro?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="page-header">
      <div>
        {back && (
          <a className="back" href={back.href}>
            ← {back.label}
          </a>
        )}
        <h1>{title}</h1>
        {intro && <p className="intro">{intro}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export const Spinner = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="spinner" role="status">
    <span className="spinner-dot" />
    {label}
  </div>
);

export const ErrorBox = ({ children }: { children: ReactNode }) => (
  <div className="error-box">
    <Icon name="CircleAlert" />
    <div>{children}</div>
  </div>
);

/** Warns before leaving the page with unsaved changes. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}

export const errorText = (e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions'))
    return 'You don’t have permission to do that. Ask an existing admin to add your email.';
  const code = message.match(/\(([a-z-]+\/[a-z0-9-]+)\)/)?.[1];
  const text = message
    .replace(/^Firebase: /, '')
    .replace(/\s*\[\d+\]$/, '')
    .replace(/ \([a-z-]+\/[a-z0-9-]+\)\.?$/, '')
    .trim();
  // Firebase often says just "Error (auth/…)"; keep the code so the problem can be looked up.
  return !text || text === 'Error' ? `Something went wrong${code ? ` (${code})` : ''}.` : text;
};

export function formatDate(value: unknown) {
  const date =
    value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function'
      ? (value as { toDate: () => Date }).toDate()
      : value instanceof Date
        ? value
        : null;
  return date ? date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '–';
}
