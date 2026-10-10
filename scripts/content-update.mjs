#!/usr/bin/env node
// Turns copy changes made to content/*.json into a content update (content/updates/<id>.json), so the
// next deploy from main can carry them into the admin panel's database (see scripts/sync-content.mjs).
//
//   node scripts/content-update.mjs <id> "<what changed>" [git ref to compare with, default HEAD]
//
// Every changed text field becomes { doc, field, from, to }. Photos are left out (the admin panel stores
// them differently), and so are new or removed items, which belong in the admin panel.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [id, description, ref = 'HEAD'] = process.argv.slice(2);
if (!id || !/^[a-z0-9-]+$/.test(id) || !description) {
  console.error('Usage: node scripts/content-update.mjs <id, e.g. 2026-10-10-copy-refresh> "<what changed>" [git ref]');
  process.exit(1);
}

const IMAGE_FIELDS = new Set(['logo', 'mascot', 'photo', 'photos', 'image', 'aboutPhoto', 'daycarePhoto', 'moments', 'hero.photos', 'centerHead.photo']);
const SKIP = new Set(['order', 'hidden', 'slug']);
const COLLECTIONS = { branches: (b) => b.slug, programs: (p) => p.slug, jobs: (j) => j.slug, testimonials: (_, i) => `t${String(i + 1).padStart(3, '0')}` };

const before = (name) => JSON.parse(execFileSync('git', ['show', `${ref}:content/${name}.json`], { cwd: root, encoding: 'utf8' }));
const after = (name) => JSON.parse(fs.readFileSync(path.join(root, 'content', `${name}.json`), 'utf8'));
const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Field-level differences; objects are compared key by key, arrays and text as a whole. */
function diff(doc, a, b, prefix = '') {
  const out = [];
  for (const key of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    const field = prefix ? `${prefix}.${key}` : key;
    if (SKIP.has(field) || IMAGE_FIELDS.has(field) || IMAGE_FIELDS.has(key)) continue;
    const from = a?.[key];
    const to = b?.[key];
    if (same(from, to)) continue;
    if (isObject(from) && isObject(to)) out.push(...diff(doc, from, to, field));
    else if (to !== undefined) out.push({ doc, field, from: from ?? null, to });
  }
  return out;
}

const changes = [];
for (const name of ['site', 'sections']) changes.push(...diff(`content/${name}`, before(name), after(name)));
for (const [name, keyOf] of Object.entries(COLLECTIONS)) {
  const old = new Map(before(name).map((item, i) => [keyOf(item, i), item]));
  after(name).forEach((item, i) => {
    const key = keyOf(item, i);
    if (!old.has(key)) console.warn(`New ${name} item "${key}" is not included: add it in the admin panel.`);
    else changes.push(...diff(`${name}/${key}`, old.get(key), item));
  });
}

const file = path.join(root, 'content', 'updates', `${id}.json`);
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, `${JSON.stringify({ id, description, changes }, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, file)} with ${changes.length} field change(s).`);
