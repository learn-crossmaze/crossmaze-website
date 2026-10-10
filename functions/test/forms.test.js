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

const application = { form_type: 'job_application', name: 'Meera', phone: '9845012345', email: 'm@example.com', position: 'Teacher / Facilitator', experience: 'Fresher', qualification: 'B.Ed' };
const fileOf = (name, bytes) => ({ name, data: Buffer.from(bytes).toString('base64') });
const pdf = fileOf('Meera CV (final).pdf', [...Buffer.from('%PDF-1.7\n'), ...new Array(200).fill(32)]);

test('job application accepts an uploaded resume and names it safely', () => {
  const r = validateSubmission({ ...application, resume: pdf });
  assert.equal(r.ok, true);
  assert.equal(r.files.resume.name, 'Meera-CV-final.pdf');
  assert.equal(r.files.resume.contentType, 'application/pdf');
  assert.equal(r.files.resume.folder, 'resumes');
  assert.equal(r.files.resume.buffer.subarray(0, 4).toString(), '%PDF');
});

test('applications from older pages (no upload, maybe a link) still go through', () => {
  const r = validateSubmission(application);
  assert.equal(r.ok, true);
  assert.deepEqual(r.files, {});
  assert.equal(validateSubmission({ ...application, resume_link: 'drive folder' }).ok, false);
  assert.equal(validateSubmission({ ...application, resume_link: 'https://drive.google.com/x' }).ok, true);
});

test('accepts Word documents and photos, recognised by their contents', () => {
  for (const [name, magic] of [
    ['cv.docx', [0x50, 0x4b, 0x03, 0x04]],
    ['cv.doc', [0xd0, 0xcf, 0x11, 0xe0]],
    ['cv.JPG', [0xff, 0xd8, 0xff, 0xe0]],
    ['cv.png', [0x89, 0x50, 0x4e, 0x47]],
  ]) {
    const r = validateSubmission({ ...application, resume: fileOf(name, [...magic, 0, 0, 0, 0]) });
    assert.equal(r.ok, true, name);
  }
});

test('rejects files that are not documents, renamed files, unreadable data and big files', () => {
  const errorFor = (resume) => validateSubmission({ ...application, resume }).errors;
  const typeError = ['Resume must be a PDF, Word document or photo (JPG or PNG)'];
  assert.deepEqual(errorFor(fileOf('cv.pdf', [...Buffer.from('<html><script>')])), typeError);
  assert.deepEqual(errorFor(fileOf('cv.exe', [0x4d, 0x5a, 0x90, 0x00])), typeError);
  assert.deepEqual(errorFor(fileOf('photo.pdf', [0xff, 0xd8, 0xff, 0xe0])), typeError);
  assert.deepEqual(errorFor({ name: 'cv.pdf', data: 'not base64!' }), ['Resume could not be read']);
  assert.deepEqual(errorFor(fileOf('cv.pdf', [...Buffer.from('%PDF'), ...new Array(5 * 1024 * 1024).fill(0)])), ['Resume is larger than 5 MB']);
});

test('ignores a page value that is not a site path', () => {
  assert.equal(validateSubmission({ ...enquiry, page: 'https://evil.example' }).page, '');
});

test('honeypot marks bots', () => {
  assert.equal(isSpam({ _gotcha: 'http://spam' }), true);
  assert.equal(isSpam({ _gotcha: '' }), false);
});
