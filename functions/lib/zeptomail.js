// Sends email through Zoho CPaaS (Zoho's email-sending service, called ZeptoMail until 2026), for the
// website's alerts to admins.
//
// Settings live in Firestore at private/zeptomail (edited in the admin panel → Email alerts):
//   { enabled: boolean, url: string, token: string, fromAddress: string, fromName?: string }
// url is the API address for the account's data centre (https://cpaas.zoho.com/v1.1/email for the US
// one; ZeptoMail's api.zeptomail.* addresses still work); token is the Agent's API key (Agents → SMTP/API
// → API Setup), with or without its "Zoho-enczapikey " prefix; fromAddress must be on a verified domain.

export const DEFAULT_URL = 'https://cpaas.zoho.com/v1.1/email';
const TIMEOUT_MS = 10000;
// Its API hosts, one per data centre: cpaas.zoho.* now, api.zeptomail.* from before the rename.
const API_HOST = /^(cpaas\.zoho|api\.zeptomail)\.(com|in|eu|com\.au|jp|ca|sa|com\.cn)$/;

/** A Zoho CPaaS (or ZeptoMail) API address, or a local one for tests. */
export function isZeptoUrl(url) {
  let parsed;
  try {
    parsed = new URL(url ?? '');
  } catch {
    return false;
  }
  if (parsed.username || parsed.password) return false;
  if (parsed.protocol === 'https:') return API_HOST.test(parsed.hostname);
  return parsed.protocol === 'http:' && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost');
}

/**
 * Sends one email.
 * @param {{ enabled?: boolean, url?: string, token?: string, fromAddress?: string, fromName?: string } | undefined} config
 * @param {{ to: string[], subject: string, html: string, text: string }} message
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<{ status: 'sent' | 'failed' | 'not_configured', httpStatus?: number, error?: string }>}
 */
export async function sendEmail(config, message, fetchImpl = fetch) {
  if (!config?.enabled || !config.token || !config.fromAddress || !message.to.length) return { status: 'not_configured' };
  if (!isZeptoUrl(config.url || DEFAULT_URL)) return { status: 'failed', error: 'The API address is not a Zoho CPaaS one' };

  const token = config.token.trim();
  const body = {
    from: { address: config.fromAddress, name: config.fromName || 'Crossmaze website' },
    to: message.to.map((address) => ({ email_address: { address } })),
    subject: message.subject,
    htmlbody: message.html,
    textbody: message.text,
  };
  try {
    const res = await fetchImpl(config.url || DEFAULT_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: /^Zoho-enczapikey\s/i.test(token) ? token : `Zoho-enczapikey ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return { status: 'sent', httpStatus: res.status };
    const answer = await res.json().catch(() => ({}));
    // Errors come as { error: { message, details: [{ message }] } } (as ZeptoMail sent them, still used for
    // a bad key) or { data: { error_code, message }, message: 'error' } (Zoho CPaaS's documented form).
    const detail = answer?.error?.details?.[0]?.message || answer?.error?.message || (Array.isArray(answer?.data) ? undefined : answer?.data?.message);
    return { status: 'failed', httpStatus: res.status, error: `Zoho CPaaS answered HTTP ${res.status}${detail ? `: ${detail}` : ''}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 'failed', error: message.includes('timeout') ? 'Zoho CPaaS did not answer in time' : message };
  }
}
