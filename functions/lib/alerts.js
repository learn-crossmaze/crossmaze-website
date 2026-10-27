// The email the admins get when a website submission couldn't be sent to LITMUS: who it was from and
// everything they filled in, so the school can call them back meanwhile.
import { FORMS } from './forms.js';
import { SITE } from './litmus.js';

const ADMIN_URL = `https://${SITE}/admin#/submissions`;

const escape = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * @param {{ id: string, type: string, data: Record<string, string>, page?: string, error?: string }} submission
 * @returns {{ subject: string, html: string, text: string }}
 */
export function litmusFailureEmail(submission) {
  const form = FORMS[submission.type];
  const kind = form?.label ?? 'Website submission';
  const data = submission.data ?? {};
  const who = data.parent_name || data.name || 'someone';
  const where = data.branch ? ` (${data.branch.replace(/^Crossmaze\s*[–-]\s*/, '')})` : '';
  // The form's fields in its own order, with their labels; anything else after them.
  const labels = form?.fields ?? {};
  const keys = [...Object.keys(labels).filter((k) => data[k]), ...Object.keys(data).filter((k) => !(k in labels) && data[k])];
  const rows = keys.map((k) => [labels[k]?.label ?? k.replace(/_/g, ' '), data[k]]);

  const subject = `${kind} not sent to LITMUS: ${who}${where}`;
  const intro = `A ${kind.toLowerCase()} from the website couldn't be sent to LITMUS${submission.error ? ` (${submission.error})` : ''}. It is saved in the admin panel, and the website tries again every 30 minutes, so please follow it up from these details meanwhile.`;
  const text = [
    intro,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    `Page: ${submission.page || '/'}`,
    '',
    `Admin panel: ${ADMIN_URL}`,
  ].join('\n');
  const html = `<p>${escape(intro)}</p>
<table cellpadding="6" style="border-collapse:collapse">
${rows.map(([label, value]) => `<tr><th align="left" valign="top">${escape(label)}</th><td>${escape(value).replace(/\n/g, '<br>')}</td></tr>`).join('\n')}
<tr><th align="left">Page</th><td>${escape(submission.page || '/')}</td></tr>
</table>
<p><a href="${ADMIN_URL}">Open Submissions in the admin panel</a></p>`;
  return { subject, html, text };
}

/** The test email the Email alerts page sends. */
export function testEmail(to) {
  const text = `This is a test from the Crossmaze website's admin panel (Email alerts), sent to ${to}. If a website enquiry or job application can't be sent to LITMUS, the full admins get an email like this with its details.`;
  return { subject: 'Test: Crossmaze website email alerts', html: `<p>${escape(text)}</p>`, text };
}
