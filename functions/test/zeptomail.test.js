import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { isZeptoUrl, sendEmail } from '../lib/zeptomail.js';
import { litmusFailureEmail, testEmail } from '../lib/alerts.js';

function fakeZepto(status, answer = {}) {
  const received = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      received.push({ headers: req.headers, body: JSON.parse(body) });
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(answer));
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, received, url: `http://127.0.0.1:${server.address().port}/v1.1/email` })));
}

const message = { to: ['admin@crossmaze.in', 'head@crossmaze.in'], subject: 'Hello', html: '<p>Hi</p>', text: 'Hi' };

test('does nothing until it is set up', async () => {
  assert.deepEqual(await sendEmail(undefined, message), { status: 'not_configured' });
  assert.deepEqual(await sendEmail({ enabled: false, token: 't', fromAddress: 'a@b.c' }, message), { status: 'not_configured' });
  assert.deepEqual(await sendEmail({ enabled: true, token: '', fromAddress: 'a@b.c' }, message), { status: 'not_configured' });
  assert.deepEqual(await sendEmail({ enabled: true, token: 't', fromAddress: 'a@b.c' }, { ...message, to: [] }), { status: 'not_configured' });
});

test('only sends to ZeptoMail', async () => {
  assert.equal(isZeptoUrl('https://api.zeptomail.com/v1.1/email'), true);
  assert.equal(isZeptoUrl('https://api.zeptomail.in/v1.1/email'), true);
  assert.equal(isZeptoUrl('https://evil.example.com/v1.1/email'), false);
  assert.equal(isZeptoUrl('https://api.zeptomail.com.evil.example/x'), false);
  assert.equal(isZeptoUrl('https://api.zeptomail.com.au/v1.1/email'), true);
  const result = await sendEmail({ enabled: true, url: 'https://evil.example.com/', token: 't', fromAddress: 'a@b.c' }, message);
  assert.equal(result.status, 'failed');
});

test('posts the email with the token', async () => {
  const zepto = await fakeZepto(201, { data: [{ code: 'EM_104', message: 'Email request received' }] });
  try {
    const config = { enabled: true, url: zepto.url, token: 'abc123', fromAddress: 'noreply@crossmaze.in' };
    assert.deepEqual(await sendEmail(config, message), { status: 'sent', httpStatus: 201 });
    const [{ headers, body }] = zepto.received;
    assert.equal(headers.authorization, 'Zoho-enczapikey abc123');
    assert.deepEqual(body.from, { address: 'noreply@crossmaze.in', name: 'Crossmaze website' });
    assert.deepEqual(body.to, [{ email_address: { address: 'admin@crossmaze.in' } }, { email_address: { address: 'head@crossmaze.in' } }]);
    assert.equal(body.subject, 'Hello');
    assert.equal(body.htmlbody, '<p>Hi</p>');
    assert.equal(body.textbody, 'Hi');
    // A token pasted with its prefix is used as it is.
    await sendEmail({ ...config, token: 'Zoho-enczapikey xyz', fromName: 'Crossmaze' }, message);
    assert.equal(zepto.received[1].headers.authorization, 'Zoho-enczapikey xyz');
    assert.equal(zepto.received[1].body.from.name, 'Crossmaze');
  } finally {
    zepto.server.close();
  }
});

test('reports ZeptoMail errors', async () => {
  const zepto = await fakeZepto(401, { error: { code: 'TM_3201', message: 'Conditions not met', details: [{ message: 'Invalid API Token found' }] } });
  try {
    const result = await sendEmail({ enabled: true, url: zepto.url, token: 'bad', fromAddress: 'a@b.c' }, message);
    assert.deepEqual(result, { status: 'failed', httpStatus: 401, error: 'ZeptoMail answered HTTP 401: Invalid API Token found' });
  } finally {
    zepto.server.close();
  }
  const down = await sendEmail({ enabled: true, url: 'http://127.0.0.1:9/v1.1/email', token: 't', fromAddress: 'a@b.c' }, message);
  assert.equal(down.status, 'failed');
});

test('the LITMUS failure email has the details', () => {
  const email = litmusFailureEmail({
    id: 'abc',
    type: 'admission_enquiry',
    data: { parent_name: 'Priya <Sharma>', phone: '98765 43210', child_name: 'Anya', branch: 'Crossmaze – Neotown', message: 'Line 1\nLine 2' },
    page: '/contact',
    error: 'LITMUS answered HTTP 503',
  });
  assert.equal(email.subject, 'Admission enquiry not sent to LITMUS: Priya <Sharma> (Neotown)');
  assert.match(email.text, /couldn't be sent to LITMUS \(LITMUS answered HTTP 503\)/);
  assert.match(email.text, /Parent name: Priya <Sharma>\nPhone: 98765 43210\nChild name: Anya\nBranch: Crossmaze – Neotown\nMessage: Line 1\nLine 2/);
  assert.match(email.text, /Admin panel: https:\/\/www\.crossmaze\.in\/admin#\/submissions/);
  assert.match(email.html, /Priya &lt;Sharma&gt;/);
  assert.match(email.html, /Line 1<br>Line 2/);
  assert.doesNotMatch(email.html, /<Sharma>/);

  const job = litmusFailureEmail({ id: 'x', type: 'job_application', data: { name: 'Asha', resume_link: 'https://files/x', resume_file: 'cv.pdf' } });
  assert.equal(job.subject, 'Job application not sent to LITMUS: Asha');
  assert.match(job.text, /Resume link: https:\/\/files\/x\nresume file: cv\.pdf/);

  assert.match(testEmail('me@crossmaze.in').text, /sent to me@crossmaze\.in/);
});
