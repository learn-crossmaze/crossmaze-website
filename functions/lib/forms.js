// The website's forms and the fields each one may send. Field names match the
// <input name="…"> attributes in src/components/EnquiryForm.astro and CareerForm.astro.

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
      resume_link: { label: 'Resume link', max: 500, url: true },
      about: { label: 'About', max: 3000 },
    },
  },
};

const PHONE = /^[0-9 +()-]{10,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks a submission from the website.
 * @param {unknown} body parsed request body
 * @returns {{ ok: true, type: string, data: Record<string, string>, page: string } | { ok: false, errors: string[] }}
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
  if (errors.length) return { ok: false, errors };

  const page = typeof input.page === 'string' && input.page.startsWith('/') ? input.page.slice(0, 200) : '';
  return { ok: true, type, data, page };
}

/** True when the hidden honeypot field was filled in, i.e. the sender is almost certainly a bot. */
export const isSpam = (body) => Boolean(body && typeof body === 'object' && String(body._gotcha ?? '').trim());
