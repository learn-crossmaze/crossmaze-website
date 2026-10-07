// Forwards website submissions to LITMUS.
//
// LITMUS settings live in Firestore at private/litmus (edited in the admin panel):
//   { enabled: boolean, url: string, headerName?: string, headerValue?: string }
// Every submission is POSTed as JSON (see buildPayload), with an optional auth header and
// an X-Crossmaze-Submission-Id header LITMUS can use to ignore duplicates on retries.

export const SITE = 'www.crossmaze.in';
const TIMEOUT_MS = 8000;

/**
 * The JSON body LITMUS receives.
 * @param {string} id Firestore submission id
 * @param {{ type: string, data: Record<string, string>, page?: string, createdAt?: Date }} submission
 */
export function buildPayload(id, submission) {
  return {
    id,
    type: submission.type,
    submittedAt: (submission.createdAt ?? new Date()).toISOString(),
    source: { site: SITE, page: submission.page || '/' },
    data: submission.data,
  };
}

/**
 * Sends one payload to LITMUS.
 * @param {{ enabled?: boolean, url?: string, headerName?: string, headerValue?: string } | undefined} config
 * @param {ReturnType<typeof buildPayload>} payload
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<{ status: 'sent' | 'failed' | 'not_configured', httpStatus?: number, error?: string, response?: string }>}
 */
export async function sendToLitmus(config, payload, fetchImpl = fetch) {
  if (!config?.enabled || !config.url) return { status: 'not_configured' };

  /** @type {Record<string, string>} */
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Crossmaze-Website/1.0',
    'X-Crossmaze-Submission-Id': payload.id,
  };
  if (config.headerName && config.headerValue) headers[config.headerName] = config.headerValue;

  try {
    const res = await fetchImpl(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const response = (await res.text().catch(() => '')).slice(0, 500);
    if (res.ok) return { status: 'sent', httpStatus: res.status, response };
    return { status: 'failed', httpStatus: res.status, error: `LITMUS answered HTTP ${res.status}`, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 'failed', error: message.includes('timeout') ? 'LITMUS did not answer in time' : message };
  }
}
