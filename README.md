# Crossmaze website

The new website for **Crossmaze Preschool and Day Care**, Bengaluru (www.crossmaze.in).
It's a fast static site built with [Astro](https://astro.build): plain HTML and CSS, with a few small scripts. It needs no server or database.

## Pages

The URLs match the current site, so existing links and Google results keep working.

| URL | Page |
| --- | --- |
| `/` | Home: hero, stats, about, core values, programs, day care, facilities, testimonials, branches, admission enquiry |
| `/about` | Who we are, core values, approach, annual-day photos, founders |
| `/our-programs` | Play Group, Nursery, Junior KG, Senior KG, Day Care, extra-curriculars, FAQs |
| `/branch` | All branches |
| `/branch/crossmaze-neotown` | One page per branch: photos, facts, amenities, gallery, centre head, map, programs, enquiry form |
| `/branch/crossmaze-neeladri` | |
| `/branch/crossmaze-snn-greenbay` | |
| `/branch/crossmaze-the-hub` | |
| `/branch/crossmaze-ananth-nagar` | |
| `/careers` | Why work with us, open roles, application form |
| `/contact` | Admission enquiry, phone / WhatsApp / email, all branch addresses |
| `/privacy-policy`, `/terms` | Carried over from the old site (`src/pages/*.md`) |

A sitemap (`/sitemap-index.xml`), `robots.txt`, social-share image and schema.org `Preschool` data for each branch are generated automatically.

## Run it locally

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # type-checks, then writes the site to dist/
npm run preview   # serve the built site
```

## Editing content

Almost all text lives in `src/data/`, so most changes don't need any page code:

| File | What it controls |
| --- | --- |
| `src/data/site.ts` | School name, phone, emails, WhatsApp, address, timings, about text, stats, core values, social links, menu |
| `src/data/branches.ts` | Branches: description, address, phone, centre head and bio, size, capacity, amenities, map; shared facilities |
| `src/data/programs.ts` | Programs, ages, write-ups, focus areas, photos; day care highlights; approach; extra-curriculars |
| `src/data/jobs.ts` | Open positions and "why work with us". Delete an entry to close a role |
| `src/data/testimonials.ts` | Parent testimonials (from the old site) |

- **Add a branch:** add an entry to `branches` and its page is created at `/branch/<slug>`.
- **Branch photos:** put photos in `src/assets/branches/<slug>/`. They're used in name order: `01.jpg` is the cover, the next five fill the gallery. The centre head's photo is `src/assets/heads/<slug>.jpg`. Astro resizes and converts them to WebP automatically at build time.
- **Other photos:** `src/assets/photos/` (programs, home and about pages); logo and mascot in `src/assets/brand/`.
- **Colours and fonts:** tokens at the top of `src/styles/global.css` (navy, red, yellow and green, taken from the logo).

## Forms

The admission enquiry and job application forms work in two modes:

1. **With a form service (recommended).** Copy `.env.example` to `.env` and set `PUBLIC_FORM_ENDPOINT`, for example to a [Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com) endpoint, then rebuild. Submissions are emailed to you and parents see a thank-you message. On Netlify / Vercel, set the variable in the project settings instead.
2. **Without one.** Submitting opens the visitor's email app with their details filled in, addressed to `admission@crossmaze.in` (or the careers email for job applications).

A hidden honeypot field filters out simple spam bots.

## Deploying (Firebase Hosting)

The site is set up for the Firebase project `crossmaze-website` (`firebase.json`, `.firebaserc`).
Pages build to files like `about.html`, and Firebase serves them at clean URLs (`/about`). URLs ending in `/` redirect to the version without it.

**Automatic (GitHub Actions).** `.github/workflows/firebase-hosting.yml` builds every push and pull request. Once the secret below exists:
- merging to `main` deploys to the live site;
- every pull request gets a temporary preview link, posted as a comment.

One-time setup:
1. In the [Firebase console](https://console.firebase.google.com/project/crossmaze-website/settings/serviceaccounts/adminsdk), open **Project settings → Service accounts → Generate new private key**. Or run `npx firebase-tools init hosting:github`, which creates the account and the secret for you.
2. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**. Name it `FIREBASE_SERVICE_ACCOUNT_CROSSMAZE_WEBSITE` and paste the whole JSON key.
3. Optional: add a repository **variable** `PUBLIC_FORM_ENDPOINT` to turn on the form service (see Forms).

**Manual (from your computer).**

```sh
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting
```

**Custom domain.** In Firebase console → Hosting → **Add custom domain**, add `www.crossmaze.in` (and `crossmaze.in`), then update the DNS records it shows at your domain registrar.

## Please verify before launch

Content, photos, logo, centre heads and testimonials come from the old crossmaze.in. A few details came from public listings or are new, so please check:

- [ ] **Phone number**: every branch uses +91 72040 21508, the only number on the old site. Add branch-specific numbers in `branches.ts` if you have them.
- [ ] **WhatsApp**: the WhatsApp button opens a chat with +91 72040 21508. Change `whatsappHref` in `site.ts` if WhatsApp is on a different number.
- [ ] **Timings**: preschool 9:00 am – 12:30 pm and day care 9:00 am – 6:00 pm came from public listings, not the old site.
- [ ] **Street addresses** for Neotown, SNN Greenbay and Neeladri Nagar came from public listings; the old site showed only area and PIN code. Ananth Nagar has no street address yet.
- [ ] **Founders and founding year** (About page) came from public sources, not the old site.
- [ ] **Careers email**: currently `admin@crossmaze.in`.
- [ ] **Firebase project ID**: `.firebaserc` and the workflow use `crossmaze-website`. If the console shows a different ID (e.g. `crossmaze-website-1a2b3`), update both.
