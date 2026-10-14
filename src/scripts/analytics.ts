// Events for Google Analytics, sent only when it's switched on (BaseLayout.astro loads it).
// Never send anything that identifies a person (names, phone numbers, emails, messages): Google's
// terms forbid it, and the privacy policy promises it.

type Gtag = (command: 'event', name: string, params: Record<string, string>) => void;

export function track(name: string, params: Record<string, string> = {}) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (!gtag) return;
  // Analytics cuts values at 100 characters.
  gtag('event', name, Object.fromEntries(Object.entries(params).filter(([, v]) => v).map(([k, v]) => [k, v.slice(0, 100)])));
}
