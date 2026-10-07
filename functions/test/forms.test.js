import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSpam, validateSubmission } from '../lib/forms.js';

const enquiry = {
  form_type: 'admission_enquiry',
  parent_name: ' Asha Rao ',
  phone: '+91 98450 12345',
  child_name: 'Kabir',
  child_age: '3 years',
  program: 'Nursery',
  branch: 'Crossmaze – Neotown',
  page: '/branch/crossmaze-neotown',
};

test('accepts a complete admission enquiry and trims values', () => {
  const r = validateSubmission(enquiry);
  assert.equal(r.ok, true);
  assert.equal(r.type, 'admission_enquiry');
  assert.equal(r.data.parent_name, 'Asha Rao');
  assert.equal(r.page, '/branch/crossmaze-neotown');
  assert.equal('email' in r.data, false);
});

test('rejects missing required fields and bad values', () => {
  const r = validateSubmission({ ...enquiry, parent_name: '', phone: 'call me', email: 'nope' });
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors, ['Parent name is required', 'Phone is not a valid phone number', 'Email is not a valid email address']);
});

test('drops fields that are not part of the form', () => {
  const r = validateSubmission({ ...enquiry, admin: 'true', __proto__x: 1 });
  assert.equal(r.ok, true);
  assert.equal('admin' in r.data, false);
});

test('rejects unknown forms and empty bodies', () => {
  assert.equal(validateSubmission({ form_type: 'payment' }).ok, false);
  assert.equal(validateSubmission(undefined).ok, false);
});

test('job application needs a valid resume link if given', () => {
  const base = { form_type: 'job_application', name: 'Meera', phone: '9845012345', email: 'm@example.com', position: 'Teacher / Facilitator', experience: 'Fresher', qualification: 'B.Ed' };
  assert.equal(validateSubmission(base).ok, true);
  assert.equal(validateSubmission({ ...base, resume_link: 'drive folder' }).ok, false);
  assert.equal(validateSubmission({ ...base, resume_link: 'https://drive.google.com/x' }).ok, true);
});

test('ignores a page value that is not a site path', () => {
  assert.equal(validateSubmission({ ...enquiry, page: 'https://evil.example' }).page, '');
});

test('honeypot marks bots', () => {
  assert.equal(isSpam({ _gotcha: 'http://spam' }), true);
  assert.equal(isSpam({ _gotcha: '' }), false);
});
