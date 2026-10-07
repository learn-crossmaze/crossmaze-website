# Crossmaze website

The website for **Crossmaze Preschool and Day Care**, Bengaluru (www.crossmaze.in), with an **admin panel** at `/admin` for editing it and a connection that sends every website enquiry and job application to **LITMUS**.

- **Website:** a fast static site built with [Astro](https://astro.build), hosted on Firebase Hosting.
- **Admin panel:** staff sign in with Google or email to edit branches, programs, the logo, contact details, jobs, testimonials and page text, upload photos, and press **Publish**.
- **Forms → LITMUS:** every admission enquiry and job application is saved in Firebase (so nothing is lost) and forwarded to LITMUS.

```
 Admin panel (/admin) ──saves──▶ Firestore + Storage ──Publish──▶ GitHub Actions ──▶ build ──▶ Firebase Hosting
                                                                    (pulls content + photos)
 Website forms ──POST /api/submit──▶ `submit` Cloud Function ──▶ Firestore "submissions" ──▶ LITMUS
```

## Pages

The URLs match the old site, so existing links and Google results keep working.

| URL | Page |
| --- | --- |
| `/` | Home: hero, stats, about, core values, programs, day care, facilities, testimonials, branches, admission enquiry |
| `/about` | Who we are, core values, approach, annual-day photos, founders |
| `/our-programs` | Play Group, Nursery, Junior KG, Senior KG, Day Care, extra-curriculars, FAQs |
| `/branch` and `/branch/<slug>` | All branches, then one page per branch: photos, facts, amenities, gallery, centre head, map, enquiry form |
| `/careers` | Why work with us, open roles, application form |
| `/contact` | Admission enquiry, phone / WhatsApp / email, all branch addresses |
| `/privacy-policy`, `/terms` | Carried over from the old site (`src/pages/*.md`) |
| `/admin` | The admin panel (not indexed by search engines) |

## Using the admin panel

Go to **www.crossmaze.in/admin** and sign in.

| Section | What you can change |
| --- | --- |
| Site settings | Logo, school name, phone, WhatsApp, emails, address, timings, social links, home-page banner, numbers strip, about text, quote, photos |
| Branches | Add, hide, reorder or delete branches; name, address, map, phone, size, capacity, amenities, programs offered, photos (first = cover), centre head with photo and bio |
| Programs | Add, hide, reorder; name, age group, timing, icon, colour, photo, description, focus list |
| Jobs | Open positions on the careers page |
| Testimonials | Parent quotes on the home page |
| Page sections | Core values, teaching approach, day care highlights, extra-curriculars, facilities, careers perks, FAQs |
| Submissions | Every enquiry and application; mark as handled, resend to LITMUS, export to CSV |
| LITMUS | Where submissions are sent, its API key, and a **Send test** button |
| Admins | Who can sign in |

**Save** stores a change; it goes live when someone presses **Publish** (top right). Publishing rebuilds the whole site in about 3 minutes, and the Dashboard shows when it's done or if it failed. New branches, programs and jobs start hidden, so you can finish them before unticking “Hide from website”.

## One-time setup

Do these once, in this order. Commands are for PowerShell, run in the project folder (`C:\Users\abhis\crossmaze-website`).

### 1. Firebase console (console.firebase.google.com → project `crossmaze-website`)

1. **Upgrade to the Blaze plan** (Cloud Functions and Storage need it). A school website's traffic normally stays within the free allowance; set a budget alert to be safe.
2. **Authentication → Get started → Sign-in method:** enable **Google** and **Email/Password**. Under **Settings → Authorized domains**, add `www.crossmaze.in` and `crossmaze.in`.
3. **Firestore Database → Create database** in **production mode**, location **asia-south1 (Mumbai)**.
4. **Storage → Get started** (production mode, same location). Note the bucket name shown (e.g. `crossmaze-website.firebasestorage.app`).
5. **Project settings → General → Your apps → Add app → Web** (any nickname). The admin panel loads this config automatically on Firebase Hosting.

### 2. A GitHub token for the Publish button

On GitHub: **Settings → Developer settings → Fine-grained personal access tokens → Generate new token**. Repository access: only `learn-crossmaze/crossmaze-website`. Permissions: **Actions: Read and write**. Copy the token, then:

```powershell
npm ci
npm ci --prefix functions
npx firebase-tools login
npx firebase-tools functions:secrets:set GITHUB_DISPATCH_TOKEN
```

(paste the token when asked).

### 3. Deploy the database rules and functions

```powershell
npx firebase-tools deploy --only firestore,storage,functions
```

Run this again whenever `firestore.rules`, `storage.rules` or anything in `functions/` changes. Website changes deploy automatically (step 5).

### 4. GitHub repository settings (Settings → Secrets and variables → Actions)

- **Secret** `FIREBASE_SERVICE_ACCOUNT_CROSSMAZE_WEBSITE`: a service-account key (Firebase console → Project settings → Service accounts → **Generate new private key**; paste the whole JSON). The account needs the **Firebase Admin** role (the default `firebase-adminsdk` account has it).
- **Variable** `ADMIN_EMAILS`: your email (comma-separate several). These people are added as admins on the next deploy.
- **Variable** `FIREBASE_STORAGE_BUCKET`: only if your bucket isn't `crossmaze-website.firebasestorage.app`.

### 5. First deploy

Merge this branch into `main`. The first deploy copies the current website content and photos into Firestore and Storage, adds the `ADMIN_EMAILS` admins, and publishes the site. After that, **the admin panel is the place to edit content**: the `content/*.json` files in the repository are only the starting copy.

Then go to `/admin` and sign in with one of the `ADMIN_EMAILS`. With email and password, choose **Create an account** first and click the verification link sent to your inbox.

### 6. Point the domain

In the Firebase console go to **Hosting → Add custom domain**, add `www.crossmaze.in` (and `crossmaze.in`), and update the DNS records it shows at your domain registrar. This replaces the old Wix site.

## LITMUS integration

Set the LITMUS URL and key in the admin panel (**LITMUS** page), then press **Send test**. For each submission, LITMUS receives:

```http
POST <LITMUS URL>
Content-Type: application/json
X-Crossmaze-Submission-Id: 9fQx2kL…        ← same on retries; use it to ignore duplicates
<header name>: <key>                        ← as set in the admin panel, e.g. Authorization: Bearer …

{
  "id": "9fQx2kL…",
  "type": "admission_enquiry",              ← or "job_application"
  "submittedAt": "2026-10-07T10:15:00.000Z",
  "source": { "site": "www.crossmaze.in", "page": "/branch/crossmaze-neotown" },
  "data": {
    "parent_name": "…", "phone": "…", "email": "…", "child_name": "…", "child_age": "…",
    "program": "Nursery", "branch": "Crossmaze – Neotown", "message": "…"
  }
}
```

Job applications send `name, phone, email, position, branch, experience, qualification, resume_link, about`. LITMUS should reply with any 2xx status. Failed deliveries are retried every 30 minutes (up to 6 times), shown as “LITMUS failed” in Submissions, and can be resent by hand. Submissions that arrive before LITMUS is set up are kept, and **Send unsent to LITMUS** delivers them later.

The form fields and validation live in `functions/lib/forms.js`; the delivery code is `functions/lib/litmus.js`.

## Developing

Requires Node.js 22.12 or newer.

```sh
npm install && npm install --prefix functions
npm run dev            # http://localhost:4321 (forms fall back to email; /admin needs .env, see below)
npm run build          # type-check + build to dist/
npm test               # functions unit tests
npm run test:rules     # Firestore + Storage security rules tests (needs Java for the emulators)
```

**Full local copy with the Firebase emulators** (no real data touched):

```sh
# build the admin panel pointed at the emulators
PUBLIC_FIREBASE_EMULATORS=true PUBLIC_FIREBASE_API_KEY=demo PUBLIC_FIREBASE_PROJECT_ID=demo-crossmaze \
PUBLIC_FIREBASE_STORAGE_BUCKET=demo-crossmaze.appspot.com PUBLIC_FIREBASE_AUTH_DOMAIN=127.0.0.1 npm run build
npx firebase-tools emulators:start --project demo-crossmaze      # site + /admin on http://127.0.0.1:5000
# in another terminal: copy the content in, and make yourself an admin
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 FIREBASE_PROJECT_ID=demo-crossmaze \
FIREBASE_STORAGE_BUCKET=demo-crossmaze.appspot.com ADMIN_EMAILS=you@example.com node scripts/sync-content.mjs --seed-if-empty
```

### How content flows

- `content/*.json` is what the site is built from. `src/data/*.ts` loads it; image fields are paths under `src/assets/`.
- `scripts/sync-content.mjs` runs before every deploy. It pulls Firestore content into those JSON files and downloads new photos into `src/assets/cms/`, which isn't committed. Astro then resizes the photos and converts them to WebP.
- `scripts/report-publish.mjs` tells the admin panel whether a deploy succeeded.
- The admin panel lives in `src/admin/`. Its forms are generated from `src/admin/schemas.ts`, so adding a field there and in `src/data/content.ts` is all it takes.

## Please verify before launch

- [ ] **Phone and WhatsApp**: every branch uses +91 72040 21508, the only number on the old site. You can change it per branch in the admin panel.
- [ ] **Timings**: preschool 9:00 am – 12:30 pm and day care 9:00 am – 6:00 pm came from public listings, not the old site.
- [ ] **Street addresses** for Neotown, SNN Greenbay and Neeladri Nagar came from public listings, and Ananth Nagar has none yet.
- [ ] **Founders and founding year** (About page) came from public sources.
- [ ] **Careers email**: currently `admin@crossmaze.in`.
- [ ] **Firebase project ID**: `.firebaserc` and the workflow use `crossmaze-website`. If the console shows a different ID, update both.
