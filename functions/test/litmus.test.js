import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { buildPayload, sendToLitmus } from '../lib/litmus.js';

const payload = buildPayload('abc123', {
  type: 'admission_enquiry',
  data: { parent_name: 'Asha' },
  page: '/contact',
  createdAt: new Date('2026-10-07T10:00:00Z'),
});

function fakeLitmus(status, delayMs = 0) {
  const received = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      received.push({ headers: req.headers, body: JSON.parse(body) });
      setTimeout(() => res.writeHead(status, { 'Content-Type': 'application/json' }).end('{"received":true}'), delayMs);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, received, url: `http://127.0.0.1:${server.address().port}/intake` })));
}

test('payload shape', () => {
  assert.deepEqual(payload, {
    id: 'abc123',
    type: 'admission_enquiry',
    submittedAt: '2026-10-07T10:00:00.000Z',
    source: { site: 'www.crossmaze.in', page: '/contact' },
    data: { parent_name: 'Asha' },
  });
});

test('does nothing until LITMUS is enabled', async () => {
  assert.deepEqual(await sendToLitmus(undefined, payload), { status: 'not_configured' });
  assert.deepEqual(await sendToLitmus({ enabled: false, url: 'http://x' }, payload), { status: 'not_configured' });
});

test('posts JSON with the auth header and submission id', async () => {
  const { server, received, url } = await fakeLitmus(201);
  const r = await sendToLitmus({ enabled: true, url, headerName: 'X-Api-Key', headerValue: 's3cret' }, payload);
  server.close();
  assert.equal(r.status, 'sent');
  assert.equal(r.httpStatus, 201);
  assert.equal(received[0].headers['x-api-key'], 's3cret');
  assert.equal(received[0].headers['x-crossmaze-submission-id'], 'abc123');
  assert.deepEqual(received[0].body, payload);
});

test('reports failures from LITMUS', async () => {
  const { server, url } = await fakeLitmus(500);
  const r = await sendToLitmus({ enabled: true, url }, payload);
  server.close();
  assert.equal(r.status, 'failed');
  assert.equal(r.httpStatus, 500);
});

test('waits as long as it is told to', async () => {
  const { server, url } = await fakeLitmus(200, 300);
  try {
    assert.deepEqual(await sendToLitmus({ enabled: true, url }, payload, fetch, 100), { status: 'failed', error: 'LITMUS did not answer in time' });
    assert.equal((await sendToLitmus({ enabled: true, url }, payload, fetch, 2000)).status, 'sent');
  } finally {
    server.closeAllConnections();
    server.close();
  }
});

test('reports unreachable LITMUS', async () => {
  const r = await sendToLitmus({ enabled: true, url: 'http://127.0.0.1:9/nothing' }, payload);
  assert.equal(r.status, 'failed');
  assert.ok(r.error);
});
