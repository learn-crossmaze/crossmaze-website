# Crossmaze website

The website for **Crossmaze Preschool and Day Care**, Bengaluru (www.crossmaze.in), with an **admin panel** at `/admin` for editing it and a connection that sends every website enquiry and job application to **LITMUS**.

- **Website:** a fast static site built with [Astro](https://astro.build), hosted on Firebase Hosting.
- **Admin panel:** staff sign in with their email and password to edit branches, programs, the logo, contact details, jobs, testimonials and page text, upload photos, and press **Publish**.
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
| `/` | Home: hero, stats, about, core values, programs, a day at Crossmaze, day care, facilities, testimonials, branches, how admission works, admission enquiry |
| `/about` | Who we are, core values, approach, annual-day photos, founders |
| `/our-programs` | Play Group, Nursery, Junior KG, Senior KG, Day Care, how we teach, a day at Crossmaze, extra-curriculars, FAQs |
| `/branch` and `/branch/<slug>` | All branches, then one page per branch: photos, facts, amenities, gallery, centre head, map, enquiry form |
| `/careers` | Why work with us, open roles, application form with resume upload |
| `/contact` | Admission enquiry, phone / WhatsApp / email, how admission works, all branch addresses |
| `/privacy-policy`, `/terms` | Carried over from the old site (`src/pages/*.md`) |
| `/admin` | The admin panel (not indexed by search engines) |

## Using the admin panel

Go to **www.crossmaze.in/admin** and sign in.

| Section | What you can change |
| --- | --- |
| Site settings | Logo, school name, phone, WhatsApp, emails, address, timings, social links, colour theme, home-page banner, numbers strip, about text, quote, photos |
| Branches | Add, hide, reorder or delete branches; name, address, map, phone, size, capacity, amenities, programs offered, photos (first = cover; the page shows six, and all of them open in a swipeable album), centre head with photo and bio |
| Programs | Add, hide, reorder; name, age group, timing, icon, colour, photo, description, focus list |
| Jobs | Open positions on the careers page |
| Testimonials | Parent quotes on the home page |
| Page sections | Core values, teaching approach, a day at Crossmaze, how admission works, day care highlights, extra-curriculars, facilities (with the photos for the scrolling strip on the home page), careers perks, FAQs |
| Submissions | Every enquiry and application; mark as handled, resend to LITMUS, export to CSV |
| Blog | Write posts with photos in six designs, keep them as drafts with a private preview link, then publish (see below) |
| Calls | Every tap on a call or WhatsApp button: which centre, page, device and how the visitor found the site; totals by centre; export to CSV (see below) |
| LITMUS | Where submissions are sent, its API key, and a **Send test** button |
| Admins | Who can sign in |

**Save** stores a change; it goes live when someone presses **Publish** (top right). Publishing rebuilds the whole site in about 3 minutes, and the Dashboard shows when it's done or if it failed. New branches, programs and jobs start hidden, so you can finish them before unticking “Hide from website”.

### Blog

**Blog → Add blog post**, give it a title, then fill in the post and choose one of six **designs**. Every design uses the same text and photos, so you can switch at any time:

| Design | Best for |
| --- | --- |
| Classic | Most posts: the cover photo on top, then the text |
| Magazine | Longer reads: a big cover photo with the title on it, and a contents list |
| Photo story | Events and trips: large photos beside short text; every photo opens in an album |
| Tips | “5 ways to…” posts: each section becomes a numbered card |
| Notice | Admissions, holidays and news: one card with a big button |
| Letter | Messages from the principal or the team, signed by the author |

A post has an opening paragraph, then **sections** (a heading, text and an optional photo each), an optional highlighted quote, key points, author and button. In the text, leave a blank line between paragraphs, start lines with “- ” for bullet points, and use `**bold**`, `_italic_` and `[link text](/contact)`.

New posts start **hidden**. Each hidden post has a private **preview link** (at the top of the post in the admin panel) that shows it after you press **Publish**, so you can check it before anyone else sees it. When it's ready, untick “Hide from website” and press **Publish**. The blog is at /blog, the newest three posts show on the home page, and “Blog” appears in the menu once a post is published.

### Calls

A website can't see who phoned or whether the call got through: tapping a call button just hands the number to the phone's dialler. What the **Calls** page shows is every tap on a call or WhatsApp button, with:

- the centre whose number was tapped, and where (the page, and the spot on it, such as a branch card or the “Call a centre” pop-up);
- the kind of device (phone, tablet or computer);
- how the visit started: a search (google.com), a social site, an ad (`utm_` tags or Google Ads), or “Direct”.

Several taps in one visit count as one person. Nothing that identifies the visitor is stored (no phone number, name or IP address), and taps from preview links aren't counted. Compare the counts with the centres' own call logs to see how many website visitors got through. The Dashboard shows the number of taps in the last 7 days.

To know who called (their number) you'd need call-tracking numbers from a telephony provider, shown on the website in place of the centres' own numbers.

### Colour themes

The site has seven colour themes: **Pastel Glass**, **Sunny Meadow**, **Ocean Breeze**, **Crayon Box**, **Montessori Calm**, and two bright ones, **Candy Pop** and **Tropical Splash**. Each theme changes the page background, colours and fonts; the boxes on top (cards, the floating header, the footer, forms and pop-ups) are white frosted glass in every theme. In **Site settings → Look and feel**, choose which one visitors see:

| Setting | What visitors see |
| --- | --- |
| The same theme every day | The theme you pick under **Theme** |
| A set theme for each day of the week | The theme you pick for that weekday |
| A different theme each day, in turn | Everyone sees the same theme on a given day; it moves to the next ticked theme each day |
| A random theme on every visit | A random ticked theme each visit, never the same as that visitor's last one |
| A random theme for each new visitor, kept on their repeat visits | A random ticked theme on someone's first visit, then the same one whenever they come back |

A visit keeps one theme from page to page. To look at a theme yourself, add `?theme=meadow` (or `pastel`, `ocean`, `crayon`, `calm`, `candy`, `tropical`) to any page address; `?theme=auto` goes back to the setting. Like other changes, a new setting goes live when you press **Publish**.

## One-time setup

Do these once, in this order. Commands are for PowerShell, run in the project folder (`C:\Users\abhis\crossmaze-website`).

### 1. Firebase console (console.firebase.google.com → project `crossmaze-website`)

1. **Upgrade to the Blaze plan** (Cloud Functions and Storage need it). A school website's traffic normally stays within the free allowance; set a budget alert to be safe.
2. **Authentication → Get started → Sign-in method:** enable **Email/Password**. Under **Settings → Authorized domains**, add `www.crossmaze.in` and `crossmaze.in`. (Optional: to also offer “Continue with Google”, enable Google there and add the GitHub variable `PUBLIC_ADMIN_GOOGLE_SIGNIN` = `true`.)
3. **Firestore Database → Create database** in **production mode**, location **asia-south1 (Mumbai)**.
4. **Storage → Get started** (production mode, same location). Note the bucket name shown (e.g. `crossmaze-website.firebasestorage.app`).
5. **Project settings → General → Your apps → Add app → Web** (any nickname). The admin panel loads this config automatically on Firebase Hosting.

### 2. A GitHub token for the Publish button

The Publish button asks GitHub to run the deploy, so it needs a token that can start workflows on this repository (and nothing else).

1. On github.com, click your profile picture → **Settings** → **Developer settings** (bottom of the left menu) → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Token name:** `Crossmaze website publish`. **Expiration:** 1 year (put a reminder in your calendar to renew it).
3. **Resource owner:** `learn-crossmaze` (the organization, not your personal account).
4. **Repository access:** *Only select repositories* → `crossmaze-website`.
5. **Permissions:** under *Repository permissions*, set **Actions** to **Read and write**. (*Metadata: Read-only* is added automatically.)
6. **Generate token** and copy it (it starts with `github_pat_` and is shown only once).
7. If the organization requires approval, an owner approves it under the organization's **Settings → Personal access tokens → Pending requests**.

Then save it in Firebase (paste when asked; the input is hidden):

```powershell
npm ci
npm ci --prefix functions
npx firebase-tools login
npx firebase-tools functions:secrets:set GITHUB_DISPATCH_TOKEN
```

When the token expires, create a new one the same way and run the last command again (then `npx firebase-tools deploy --only functions`).

### 3. Deploy the database rules and functions

```powershell
npx firebase-tools deploy --only firestore,storage,functions
```

Run this again whenever `firestore.rules`, `storage.rules` or anything in `functions/` changes. Website changes deploy automatically (step 5).

### 4. GitHub repository settings (Settings → Secrets and variables → Actions)

- **Secret** `FIREBASE_SERVICE_ACCOUNT_CROSSMAZE_WEBSITE`: a service-account key (Firebase console → Project settings → Service accounts → **Generate new private key**; paste the whole JSON file). Then give that account (`firebase-adminsdk-…@crossmaze-website.iam.gserviceaccount.com`) these roles in Google Cloud console → **IAM & Admin → IAM** → pencil icon: **Firebase Admin**, **Cloud Run Viewer** and **API Keys Viewer**. The deploy needs them to read content, download photos and publish the site.
- **Variable** `ADMIN_EMAILS`: your email (comma-separate several). These people are added as admins on the next deploy.
- **Variable** `FIREBASE_STORAGE_BUCKET`: only if your bucket isn't `crossmaze-website.firebasestorage.app`.

### 5. First deploy

Merge this branch into `main`. The first deploy copies the current website content and photos into Firestore and Storage, adds the `ADMIN_EMAILS` admins, and publishes the site. After that, **the admin panel is the place to edit content**: the `content/*.json` files in the repository are only the starting copy.

Then go to `/admin`, choose **Create an account** with one of the `ADMIN_EMAILS`, and click the verification link Firebase emails you (check spam). After that, sign in normally. New admins you add on the Admins page do the same.

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

Job applications send `name, phone, email, position, branch, experience, qualification, resume_link, resume_file, about`. `resume_link` is a private link to the resume the applicant uploaded (PDF, Word or a photo, up to 5 MB) and `resume_file` is its file name. The file is stored in Cloud Storage under `resumes/`; only admins can open it in the panel, and anyone given the link can download it, so treat the link like the resume itself. Deleting an application in Submissions also deletes its resume. LITMUS should reply with any 2xx status. Failed deliveries are retried every 30 minutes (up to 6 times), shown as “LITMUS failed” in Submissions, and can be resent by hand. Submissions that arrive before LITMUS is set up are kept, and **Send unsent to LITMUS** delivers them later.

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
- A field that's new in `content/site.json` or `content/sections.json` (such as a new page section) is copied into Firestore on the next deploy from `main`, so it appears in the admin panel. Pull-request previews use the repository's copy without writing to Firestore.
- **Changing existing copy from the repository** (reworded text, a corrected phone number) needs a content update, because the live text is in Firestore and each deploy overwrites `content/*.json` with it. Edit the JSON, then run `node scripts/content-update.mjs <id> "<what changed>"` before committing (it compares with the last commit; pass another git ref as a third argument, e.g. `origin/main`). It writes `content/updates/<id>.json`, one entry per changed field. Pull-request previews show the change without saving it. The next deploy from `main` saves it to Firestore once, and only where Firestore still has the old text, so anything edited in the admin panel is kept. The deploy log lists what was updated and what was kept. Photos inside a list that changes as a whole (such as each facility's photo) are included and copied to Cloud Storage when the update is saved; other photo fields and new items, such as a branch or a job, are added in the admin panel.
- `scripts/report-publish.mjs` tells the admin panel whether a deploy succeeded.
- Colour themes: the tokens in `src/styles/global.css` are Pastel Glass; `src/styles/themes.css` overrides them for the other themes, and `src/data/themes.ts` lists each theme's fonts. A script at the top of `layouts/BaseLayout.astro` picks the theme in the browser before the page is drawn.
- The admin panel lives in `src/admin/`. Its forms are generated from `src/admin/schemas.ts`, so adding a field there and in `src/data/content.ts` is all it takes.

## Please verify before launch

- [ ] **Branch phone numbers, addresses and map pins** come from the branch records behind the old www.crossmaze.in: The Hub +91 72040 21508, Neotown +91 73380 45201, SNN Greenbay +91 72595 10758, Neeladri Nagar +91 97409 21508 and Ananth Nagar +91 87225 70895. Call each number once to check it reaches the right centre. Neeladri Nagar's address changed from "Malligue Residency, 16th Cross Road" to "128, Gargeshwari, 13th Cross Road", as on the old site.
- [ ] **Main phone and WhatsApp**: +91 72040 21508 (The Hub's number). It is the WhatsApp number, the number search engines show, and what Call buttons dial if the centre picker can't open (admin panel → Site settings).
- [ ] **Timings**: preschool 9:00 am – 12:30 pm and day care 9:00 am – 6:00 pm came from public listings, not the old site.
- [ ] **Founders and founding year** (About page) came from public sources.
- [ ] **Careers email**: currently `admin@crossmaze.in`.
- [ ] **Facility photos** on the home page came from the old www.crossmaze.in. CCTV surveillance, Fire safe, Parents’ communication app and Trained caregivers are stock photos from Wix’s free media library, which may only be licensed for use on Wix sites: replace them with your own (admin panel → Page sections → Facilities). The school’s own facility photos on the old site were small (555 px wide), so larger originals will look sharper, especially when opened full screen.
- [ ] **Reworded copy** (October 2026): text across the site was rewritten for clarity without changing any facts. The FAQ "How do I apply for admission?" is new.
- [ ] **A day at Crossmaze** and **How admission works** were written for the new site from what the old site says. Check they match how your centres work (admin panel → Page sections).
- [ ] **Sample blog posts**: six example posts (one in each design) start as hidden drafts, written from what the site already says plus general parenting tips. Edit and publish the ones you like, and delete the rest (admin panel → Blog).
- [ ] **Firebase project ID**: `.firebaserc` and the workflow use `crossmaze-website`. If the console shows a different ID, update both.
