import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deviceOf, validateCall } from '../lib/calls.js';

const tap = {
  event: 'contact',
  channel: 'phone',
  number: '+91 73380 45201',
  branch: 'Neotown',
  page: '/branch/crossmaze-neotown',
  place: 'Branch card',
  source: 'google.com',
  visit: 'k3j9x0a1bq',
  device: 'Phone',
};

test('accepts a call tap and keeps only the digits of the number', () => {
  const r = validateCall(tap);
  assert.equal(r.ok, true);
  assert.deepEqual(r.call, {
    channel: 'phone',
    number: '917338045201',
    branch: 'Neotown',
    page: '/branch/crossmaze-neotown',
    place: 'Branch card',
    source: 'google.com',
    visit: 'k3j9x0a1bq',
    device: 'Phone',
  });
});

test('accepts WhatsApp taps and fills in blanks for missing details', () => {
  const r = validateCall({ event: 'contact', channel: 'whatsapp', number: '917338045201' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.call, { channel: 'whatsapp', number: '917338045201', branch: '', page: '', place: '', source: '', visit: '', device: '' });
});

test('rejects anything that is not a call or WhatsApp tap', () => {
  assert.equal(validateCall(undefined).ok, false);
  assert.equal(validateCall({ ...tap, event: 'enquiry' }).ok, false);
  assert.equal(validateCall({ ...tap, channel: 'email' }).ok, false);
  assert.equal(validateCall({ ...tap, number: '12' }).ok, false);
  assert.equal(validateCall({ ...tap, number: '1'.repeat(16) }).ok, false);
  assert.equal(validateCall({ ...tap, number: 12345678 }).ok, false);
});

test('cleans up the free-text details', () => {
  const r = validateCall({
    ...tap,
    page: 'https://evil.example/',
    place: `  Admission\n  enquiry ${'x'.repeat(300)}`,
    visit: 'not a code!',
    device: 'Fridge',
  });
  assert.equal(r.ok, true);
  assert.equal(r.call.page, '');
  assert.ok(r.call.place.startsWith('Admission enquiry x'));
  assert.equal(r.call.place.length, 120);
  assert.equal(r.call.visit, '');
  assert.equal(r.call.device, '');
});

test('guesses the device from the user agent', () => {
  assert.equal(deviceOf('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36'), 'Phone');
  assert.equal(deviceOf('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'), 'Phone');
  assert.equal(deviceOf('Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 Chrome/126 Safari/537.36'), 'Tablet');
  assert.equal(deviceOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'), 'Computer');
  assert.equal(deviceOf(undefined), '');
});
