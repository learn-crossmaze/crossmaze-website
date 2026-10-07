#!/usr/bin/env node
// Keeps content/*.json (what the site is built from) in step with the admin panel (Firestore).
//
//   node scripts/sync-content.mjs                 pull Firestore content + photos into the repo files
//   node scripts/sync-content.mjs --seed-if-empty first copy the repo content into Firestore if it's empty, then pull
//   node scripts/sync-content.mjs --seed          only copy the repo content into Firestore (overwrites!)
//   ADMIN_EMAILS=a@x.com,b@y.com …                also makes sure these people can sign in to /admin
//
// Photos: Firestore stores Cloud Storage paths ("site/…"). When pulling, a photo that is unchanged from the
// copy in src/assets/ keeps its repo path; anything new or changed is downloaded to src/assets/cms/.
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FieldValue } from 'firebase-admin/firestore';
import { connect, hasCredentials } from './firebase.mjs';

// The Storage client attaches a listener per request to a shared stream; dozens of photos is expected.
EventEmitter.defaultMaxListeners = 100;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');
const assetsDir = path.join(root, 'src', 'assets');
const cmsDir = path.join(assetsDir, 'cms');

const COLLECTIONS = ['branches', 'programs', 'jobs', 'testimonials'];
const SINGLETONS = ['site', 'sections'];

const args = new Set(process.argv.slice(2));

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(contentDir, `${name}.json`), 'utf8'));
const writeJson = (name, data) =>
  fs.writeFileSync(path.join(contentDir, `${name}.json`), `${JSON.stringify(data, null, 2)}\n`);
const md5 = (file) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('base64');

/** Applies `fn` to every image path in a piece of content and returns the updated copy. */
async function mapImages(kind, item, fn) {
  const copy = structuredClone(item);
  const photo = async (p) => (p?.image ? { ...p, image: await fn(p.image) } : p);
  // One at a time: keeps Cloud Storage requests (and log output) calm.
  const each = async (list, map) => {
    const out = [];
    for (const entry of list ?? []) out.push(await map(entry));
    return out;
  };
  if (kind === 'site') {
    copy.logo = await fn(copy.logo);
    copy.mascot = await fn(copy.mascot);
    copy.hero.photos = await each(copy.hero.photos, photo);
    copy.aboutPhoto = await photo(copy.aboutPhoto);
    copy.daycarePhoto = await photo(copy.daycarePhoto);
    copy.moments = await each(copy.moments, photo);
  } else if (kind === 'programs') {
    copy.photo = await fn(copy.photo);
  } else if (kind === 'branches') {
    copy.photos = await each(copy.photos, fn);
    if (copy.centerHead?.photo) copy.centerHead.photo = await fn(copy.centerHead.photo);
  }
  return copy;
}

// ---------------------------------------------------------------- seed: repo -> Firestore

async function seed(db, bucket) {
  const upload = async (localPath) => {
    if (!localPath) return '';
    const file = path.join(assetsDir, localPath);
    const dest = `site/${localPath.replace(/^cms\//, '')}`;
    const [exists] = await bucket.file(dest).exists();
    if (!exists) await bucket.upload(file, { destination: dest, metadata: { cacheControl: 'public, max-age=3600' } });
    return dest;
  };

  const batch = db.batch();
  for (const name of SINGLETONS) {
    const data = name === 'site' ? await mapImages('site', readJson(name), upload) : readJson(name);
    batch.set(db.doc(`content/${name}`), data);
  }
  for (const name of COLLECTIONS) {
    const items = readJson(name);
    for (const [order, item] of items.entries()) {
      const data = await mapImages(name, item, upload);
      const id = name === 'testimonials' ? `t${String(order + 1).padStart(3, '0')}` : item.slug;
      batch.set(db.doc(`${name}/${id}`), { ...data, order });
    }
  }
  batch.set(db.doc('meta/content'), { seededAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  await batch.commit();
  console.log('Seeded Firestore and Storage from the content in this repository.');
}

// ---------------------------------------------------------------- pull: Firestore -> repo

/** Fills in anything an editor left empty so a half-finished entry can't break the build. */
const list = (value) => (Array.isArray(value) ? value.filter((v) => v !== null && v !== undefined && v !== '') : []);
const text = (value) => (typeof value === 'string' ? value : value == null ? '' : String(value));

const normalize = {
  site: (s) => ({
    ...s,
    address: list(s.address),
    about: list(s.about),
    stats: list(s.stats),
    social: list(s.social),
    founders: list(s.founders),
    moments: list(s.moments).filter((m) => m.image),
    hero: { ...s.hero, photos: list(s.hero?.photos).filter((p) => p.image) },
  }),
  sections: (s) =>
    Object.fromEntries(
      ['coreValues', 'approach', 'daycareHighlights', 'extracurricular', 'facilities', 'perks', 'faqs'].map((k) => [k, list(s[k])]),
    ),
  branches: (b) => ({
    ...b,
    description: list(b.description),
    address: list(b.address),
    amenities: list(b.amenities),
    programs: list(b.programs),
    photos: list(b.photos),
    capacity: b.capacity ? Number(b.capacity) : undefined,
    centerHead: b.centerHead?.name ? { ...b.centerHead, bio: list(b.centerHead.bio) } : undefined,
  }),
  programs: (p) => ({ ...p, paragraphs: list(p.paragraphs), focus: list(p.focus) }),
  jobs: (j) => ({ ...j, timings: list(j.timings), responsibilities: list(j.responsibilities).filter((r) => r.text) }),
  testimonials: (t) => t,
};

const required = {
  site: ['name', 'fullName', 'phone', 'logo'],
  branches: ['slug', 'name'],
  programs: ['slug', 'name', 'photo'],
  jobs: ['slug', 'title'],
  testimonials: ['quote', 'name'],
};

function check(kind, item, label) {
  for (const key of required[kind] ?? []) {
    if (!text(item[key]).trim()) throw new Error(`${label} is missing "${key}". Fill it in on the admin panel and publish again.`);
  }
  if (kind === 'branches' && !/^[a-z0-9-]+$/.test(item.slug)) throw new Error(`Branch "${item.name}" has an invalid web address.`);
}

async function pull(db, bucket) {
  const download = async (storagePath) => {
    if (!storagePath) return '';
    if (!storagePath.startsWith('site/')) return storagePath; // already a repo path
    const relative = storagePath.slice('site/'.length);
    const file = bucket.file(storagePath);
    const [meta] = await file.getMetadata();
    const local = path.join(assetsDir, relative);
    if (fs.existsSync(local) && md5(local) === meta.md5Hash) return relative;
    const dest = path.join(cmsDir, relative);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await file.download({ destination: dest });
    return `cms/${relative}`;
  };

  fs.rmSync(cmsDir, { recursive: true, force: true });
  const out = {};

  for (const name of SINGLETONS) {
    const snap = await db.doc(`content/${name}`).get();
    if (!snap.exists) throw new Error(`Firestore has no content/${name}. Run with --seed-if-empty first.`);
    const data = normalize[name](snap.data());
    check(name, data, name === 'site' ? 'Site settings' : 'Page sections');
    out[name] = await mapImages(name, data, download);
  }
  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get();
    const docs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d) => d.hidden !== true)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    out[name] = [];
    for (const doc of docs) {
      const { id, order, hidden, updatedAt, ...rest } = doc;
      const item = normalize[name](name === 'testimonials' ? rest : { ...rest, slug: rest.slug || id });
      check(name, item, `${name.replace(/s$/, '')} "${item.name ?? item.title ?? id}"`);
      out[name].push(await mapImages(name, item, download));
    }
  }

  for (const [name, data] of Object.entries(out)) writeJson(name, data);
  const downloaded = fs.existsSync(cmsDir) ? fs.readdirSync(cmsDir, { recursive: true }).filter((f) => /\.\w+$/.test(f)).length : 0;
  console.log(
    `Pulled content from Firestore: ${out.branches.length} branches, ${out.programs.length} programs, ${out.jobs.length} jobs, ${out.testimonials.length} testimonials; ${downloaded} new photos downloaded.`,
  );
}

async function ensureAdmins(db) {
  const emails = (process.env.ADMIN_EMAILS ?? '')
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  for (const email of emails) {
    const ref = db.doc(`admins/${email}`);
    if (!(await ref.get()).exists) {
      await ref.set({ email, addedBy: 'ADMIN_EMAILS', addedAt: FieldValue.serverTimestamp() });
      console.log(`Added admin ${email}`);
    }
  }
}

if (!hasCredentials()) {
  console.log('No Firebase credentials found; building from the content already in the repository.');
  process.exit(0);
}

const { db, bucket } = connect();
await ensureAdmins(db);
if (args.has('--seed')) {
  await seed(db, bucket);
} else {
  if (args.has('--seed-if-empty') && !(await db.doc('content/site').get()).exists) await seed(db, bucket);
  await pull(db, bucket);
}
