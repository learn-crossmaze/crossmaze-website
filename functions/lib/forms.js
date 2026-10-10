// The website's forms and the fields each one may send. Field names match the
// <input name="…"> attributes in src/components/EnquiryForm.astro and CareerForm.astro.
// Files (the resume) arrive base64-encoded in the same JSON body; the submit function stores them
// privately in Cloud Storage and adds a link to the submission (e.g. resume -> resume_link).

export const FORMS = {
  admission_enquiry: {
    label: 'Admission enquiry',
    fields: {
      parent_name: { label: 'Parent name', required: true, max: 120 },
      phone: { label: 'Phone', required: true, max: 20, phone: true },
      email: { label: 'Email', max: 160, email: true },
      child_name: { label: 'Child name', required: true, max: 120 },
      child_age: { label: 'Child age', required: true, max: 60 },
      program: { label: 'Program', required: true, max: 120 },
      branch: { label: 'Branch', required: true, max: 120 },
      message: { label: 'Message', max: 3000 },
    },
  },
  job_application: {
    label: 'Job application',
    fields: {
      name: { label: 'Name', required: true, max: 120 },
      phone: { label: 'Phone', required: true, max: 20, phone: true },
      email: { label: 'Email', required: true, max: 160, email: true },
      position: { label: 'Position', required: true, max: 120 },
      branch: { label: 'Preferred branch', max: 120 },
      experience: { label: 'Experience', required: true, max: 60 },
      qualification: { label: 'Qualification', required: true, max: 300 },
      // Older pages sent a link instead of a file; still accepted so no application is lost.
      resume_link: { label: 'Resume link', max: 500, url: true },
      about: { label: 'About', max: 3000 },
    },
    // The careers form makes the resume required; the server doesn't, so applications from pages
    // published before the upload existed (and the website and this function updating at
    // different times) still go through.
    files: {
      resume: { label: 'Resume', folder: 'resumes', maxBytes: 5 * 1024 * 1024 },
    },
  },
};

// File types a visitor may upload, recognised by their first bytes (not just the name they were given).
const FILE_TYPES = [
  { ext: ['pdf'], contentType: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  {
    ext: ['docx'],
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    magic: [0x50, 0x4b, 0x03, 0x04],
  },
  { ext: ['doc'], contentType: 'application/msword', magic: [0xd0, 0xcf, 0x11, 0xe0] },
  { ext: ['jpg', 'jpeg'], contentType: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  { ext: ['png'], contentType: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47] },
];

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Checks one uploaded file, sent as { name, data } with the contents base64-encoded.
 * @param {{ label: string, maxBytes: number }} rule
 * @param {unknown} value
 * @returns {{ ok: true, file: { name: string, contentType: string, buffer: Buffer } } | { ok: false, error: string }}
 */
export function validateFile(rule, value) {
  const input = value && typeof value === 'object' ? /** @type {Record<string, unknown>} */ (value) : {};
  const name = typeof input.name === 'string' ? input.name : '';
  const data = typeof input.data === 'string' ? input.data.replace(/^data:[^,]*,/, '') : '';
  if (!data || data.length % 4 !== 0 || !BASE64.test(data)) return { ok: false, error: `${rule.label} could not be read` };
  if ((data.length / 4) * 3 > rule.maxBytes + 3) return { ok: false, error: `${rule.label} is larger than ${rule.maxBytes / 1024 / 1024} MB` };

  const buffer = Buffer.from(data, 'base64');
  if (!buffer.length) return { ok: false, error: `${rule.label} is empty` };
  if (buffer.length > rule.maxBytes) return { ok: false, error: `${rule.label} is larger than ${rule.maxBytes / 1024 / 1024} MB` };

  const ext = (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? '').toLowerCase();
  const kind = FILE_TYPES.find((t) => t.magic.every((byte, i) => buffer[i] === byte) && (!ext || t.ext.includes(ext)));
  if (!kind) return { ok: false, error: `${rule.label} must be a PDF, Word document or photo (JPG or PNG)` };

  const base = name.replace(/\.[^.]*$/, '').replace(/[^\w.-]+/g, '-').replace(/^[-.]+|-+$/g, '').slice(0, 60) || 'file';
  return { ok: true, file: { name: `${base}.${kind.ext[0]}`, contentType: kind.contentType, buffer } };
}

const PHONE = /^[0-9 +()-]{10,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks a submission from the website.
 * @param {unknown} body parsed request body
 * @returns {{ ok: true, type: string, data: Record<string, string>, page: string, files: Record<string, { name: string, contentType: string, buffer: Buffer, folder: string }> } | { ok: false, errors: string[] }}
 */
export function validateSubmission(body) {
  if (!body || typeof body !== 'object') return { ok: false, errors: ['Empty submission'] };
  const input = /** @type {Record<string, unknown>} */ (body);
  const type = String(input.form_type ?? '');
  const form = FORMS[/** @type {keyof typeof FORMS} */ (type)];
  if (!form) return { ok: false, errors: ['Unknown form'] };

  const errors = [];
  /** @type {Record<string, string>} */
  const data = {};
  for (const [name, rule] of Object.entries(form.fields)) {
    const raw = input[name];
    const value = typeof raw === 'string' ? raw.trim() : raw == null ? '' : String(raw).trim();
    if (!value) {
      if (rule.required) errors.push(`${rule.label} is required`);
      continue;
    }
    if (value.length > rule.max) errors.push(`${rule.label} is too long`);
    else if (rule.phone && !PHONE.test(value)) errors.push(`${rule.label} is not a valid phone number`);
    else if (rule.email && !EMAIL.test(value)) errors.push(`${rule.label} is not a valid email address`);
    else if (rule.url && !/^https?:\/\/\S+$/i.test(value)) errors.push(`${rule.label} must be a web link`);
    else data[name] = value;
  }
  /** @type {Record<string, { name: string, contentType: string, buffer: Buffer, folder: string }>} */
  const files = {};
  for (const [name, rule] of Object.entries(form.files ?? {})) {
    if (input[name] == null || input[name] === '') {
      if (rule.required) errors.push(`${rule.label} is required`);
      continue;
    }
    const checked = validateFile(rule, input[name]);
    if (checked.ok) files[name] = { ...checked.file, folder: rule.folder };
    else errors.push(checked.error);
  }
  if (errors.length) return { ok: false, errors };

  const page = typeof input.page === 'string' && input.page.startsWith('/') ? input.page.slice(0, 200) : '';
  return { ok: true, type, data, page, files };
}

/** True when the hidden honeypot field was filled in, i.e. the sender is almost certainly a bot. */
export const isSpam = (body) => Boolean(body && typeof body === 'object' && String(body._gotcha ?? '').trim());
