// Sends email through ZeptoMail (Zoho's email-sending service), for the website's alerts to admins.
//
// Settings live in Firestore at private/zeptomail (edited in the admin panel → Email alerts):
//   { enabled: boolean, url: string, token: string, fromAddress: string, fromName?: string }
// url is the ZeptoMail API address for the account's data centre (https://api.zeptomail.com/v1.1/email
// for the US one); token is a Send Mail token from ZeptoMail (Mail Agents → SMTP/API → API), with or
// without its "Zoho-enczapikey " prefix; fromAddress must be on a domain verified in ZeptoMail.

export const DEFAULT_URL = 'https://api.zeptomail.com/v1.1/email';
const TIMEOUT_MS = 10000;

/** A ZeptoMail API address (one of its data centres), or a local one for tests. */
export const isZeptoUrl = (url) =>
  /^(https:\/\/api\.zeptomail\.(com|in|eu|com\.au|jp|ca|sa|com\.cn)\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(url ?? '');

/**
 * Sends one email.
 * @param {{ enabled?: boolean, url?: string, token?: string, fromAddress?: string, fromName?: string } | undefined} config
 * @param {{ to: string[], subject: string, html: string, text: string }} message
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<{ status: 'sent' | 'failed' | 'not_configured', httpStatus?: number, error?: string }>}
 */
export async function sendEmail(config, message, fetchImpl = fetch) {
  if (!config?.enabled || !config.token || !config.fromAddress || !message.to.length) return { status: 'not_configured' };
  if (!isZeptoUrl(config.url || DEFAULT_URL)) return { status: 'failed', error: 'The ZeptoMail API address is not a ZeptoMail one' };

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
    const detail = answer?.error?.details?.[0]?.message || answer?.error?.message;
    return { status: 'failed', httpStatus: res.status, error: `ZeptoMail answered HTTP ${res.status}${detail ? `: ${detail}` : ''}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 'failed', error: message.includes('timeout') ? 'ZeptoMail did not answer in time' : message };
  }
}
