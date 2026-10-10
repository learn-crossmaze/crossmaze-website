#!/usr/bin/env node
// Keeps content/*.json (what the site is built from) in step with the admin panel (Firestore).
//
//   node scripts/sync-content.mjs                 pull Firestore content + photos into the repo files
//   node scripts/sync-content.mjs --seed-if-empty first copy the repo content into Firestore if it's empty, then pull
//   node scripts/sync-content.mjs --seed          only copy the repo content into Firestore (overwrites!)
//   … --add-missing                               also store content fields that are new in the repo (e.g. a new
//                                                 page section) in Firestore, so the admin panel can edit them,
//                                                 and save pending content updates (content/updates/, see below)
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

const updatesDir = path.join(contentDir, 'updates');

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
      ['coreValues', 'approach', 'daycareHighlights', 'extracurricular', 'facilities', 'perks', 'faqs', 'dayRoutine', 'admissionSteps'].map(
        (k) => [k, list(s[k])],
      ),
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

/**
 * Content fields added to the site after Firestore was seeded (such as a new page section) aren't in
 * Firestore yet. Build them from the repository's copy, and with --add-missing also store them in
 * Firestore so they appear in the admin panel. Fields an editor emptied are left alone.
 */
async function withNewFields(db, name, data) {
  const repo = readJson(name);
  const missing = Object.keys(repo).filter((key) => !(key in data));
  if (!missing.length) return data;
  const added = Object.fromEntries(missing.map((key) => [key, repo[key]]));
  if (args.has('--add-missing')) {
    await db.doc(`content/${name}`).set(added, { merge: true });
    console.log(`Added new content to Firestore (content/${name}): ${missing.join(', ')}`);
  } else {
    console.log(`Firestore content/${name} has no ${missing.join(', ')} yet; using the repository's copy.`);
  }
  return { ...data, ...added };
}

// ---------------------------------------------------------------- content updates
// content/updates/*.json carry copy changes made in the repository after Firestore was seeded (e.g. a
// rewrite of the page text or corrected branch details), written by scripts/content-update.mjs. Each change
// names a document, a field (dotted for nested ones) and its old and new value. A field is only updated
// while Firestore still holds the old value, so anything an editor changed in the admin panel is kept.
// Previews apply updates in memory only; deploys from main (--add-missing) also save them to Firestore and
// record each update in meta/contentUpdates so it is applied once.

const canonical = (v) =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])]))
      : v;
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const getPath = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
function setPath(obj, dotted, value) {
  const keys = dotted.split('.');
  const last = keys.pop();
  let o = obj;
  for (const k of keys) o = o[k] && typeof o[k] === 'object' ? o[k] : (o[k] = {});
  o[last] = value;
}

class ContentUpdates {
  constructor(list, applied) {
    this.pending = list.filter((u) => !applied[u.id]);
    /** @type {Map<string, Record<string, unknown>>} document path -> fields to save */
    this.writes = new Map();
    this.report = Object.fromEntries(this.pending.map((u) => [u.id, { changed: 0, current: 0, kept: [], seen: new Set() }]));
  }

  static async load(db) {
    const list = fs.existsSync(updatesDir)
      ? fs
          .readdirSync(updatesDir)
          .filter((f) => f.endsWith('.json'))
          .sort()
          .map((f) => JSON.parse(fs.readFileSync(path.join(updatesDir, f), 'utf8')))
      : [];
    const applied = list.length ? ((await db.doc('meta/contentUpdates').get()).data()?.applied ?? {}) : {};
    return new ContentUpdates(list, applied);
  }

  /** Applies the pending changes for one document to its data (in place). */
  apply(docPath, data) {
    for (const update of this.pending) {
      const report = this.report[update.id];
      update.changes.forEach((change, i) => {
        if (change.doc !== docPath) return;
        report.seen.add(i);
        const now = getPath(data, change.field) ?? null;
        if (same(now, change.to)) report.current += 1;
        else if (same(now, change.from)) {
          setPath(data, change.field, change.to);
          const fields = this.writes.get(docPath) ?? {};
          fields[change.field] = change.to;
          this.writes.set(docPath, fields);
          report.changed += 1;
        } else report.kept.push(`${docPath} ${change.field}`);
      });
    }
    return data;
  }

  /** Logs what happened and, when `save` is set, writes the changes and marks the updates as applied. */
  async finish(db, save) {
    for (const update of this.pending) {
      const r = this.report[update.id];
      const missing = update.changes.filter((_, i) => !r.seen.has(i)).map((c) => c.doc);
      console.log(
        `Content update ${update.id}: ${r.changed} field(s) ${save ? 'updated' : 'updated for this preview only'}` +
          `${r.current ? `, ${r.current} already up to date` : ''}` +
          `${r.kept.length ? `, ${r.kept.length} kept as edited in the admin panel (${r.kept.join('; ')})` : ''}` +
          `${missing.length ? `, ${missing.length} skipped because the item no longer exists (${[...new Set(missing)].join(', ')})` : ''}.`,
      );
    }
    if (!save || !this.pending.length) return;
    for (const [docPath, fields] of this.writes) await db.doc(docPath).update(fields);
    const applied = Object.fromEntries(
      this.pending.map((u) => [u.id, { appliedAt: FieldValue.serverTimestamp(), changed: this.report[u.id].changed, kept: this.report[u.id].kept }]),
    );
    await db.doc('meta/contentUpdates').set({ applied }, { merge: true });
  }
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
  const updates = await ContentUpdates.load(db);

  for (const name of SINGLETONS) {
    const snap = await db.doc(`content/${name}`).get();
    if (!snap.exists) throw new Error(`Firestore has no content/${name}. Run with --seed-if-empty first.`);
    const data = normalize[name](updates.apply(`content/${name}`, await withNewFields(db, name, snap.data())));
    check(name, data, name === 'site' ? 'Site settings' : 'Page sections');
    out[name] = await mapImages(name, data, download);
  }
  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get();
    const docs = snap.docs
      .map((d) => ({ id: d.id, ...updates.apply(`${name}/${d.id}`, d.data()) }))
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
  await updates.finish(db, args.has('--add-missing'));
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
  const empty = !(await db.doc('content/site').get()).exists;
  if (empty && args.has('--seed-if-empty')) {
    await seed(db, bucket);
  } else if (empty) {
    // e.g. a pull-request preview before the first deploy to main has filled Firestore.
    console.log('Firestore has no content yet; building from the content already in the repository.');
    process.exit(0);
  }
  await pull(db, bucket);
}
