# Crossmaze website

The new website for **Crossmaze Preschool and Day Care**, Bengaluru (www.crossmaze.in).
It's a fast static site built with [Astro](https://astro.build): plain HTML and CSS, with a few small scripts. It needs no server or database.

## Pages

The URLs match the current site, so existing links and Google results keep working.

| URL | Page |
| --- | --- |
| `/` | Home: hero, approach, programs, safety, a day at Crossmaze, branches, admission enquiry |
| `/about` | Story, values, approach, founders |
| `/our-programs` | Play Group, Nursery, Junior KG, Senior KG, Day Care, extra-curriculars, FAQs |
| `/branch` | All branches |
| `/branch/crossmaze-neotown` | One page per branch: facts, map, programs, facilities, enquiry form |
| `/branch/crossmaze-neeladri` | |
| `/branch/crossmaze-snn-greenbay` | |
| `/branch/crossmaze-the-hub` | |
| `/branch/crossmaze-ananth-nagar` | |
| `/careers` | Why work with us, open roles, application form |
| `/contact` | Admission enquiry, phone / WhatsApp / email, all branch addresses |

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
| `src/data/site.ts` | School name, phone, emails, WhatsApp, timings, founders, social links, main menu |
| `src/data/branches.ts` | Branches: address, phone, centre head, size, capacity, map, programs, optional photo |
| `src/data/programs.ts` | Programs, ages, descriptions, highlights; teaching approach; extra-curriculars |
| `src/data/jobs.ts` | Open positions and "why work with us". Delete an entry to close a role |
| `src/data/testimonials.ts` | Parent quotes. The section stays hidden until you add at least one |

- **Add a branch:** add an entry to `branches` and its page is created at `/branch/<slug>`.
- **Add photos:** put images in `public/images/` and set `image: '/images/branches/crossmaze-neotown.jpg'` on a branch.
- **Logo:** the maze mark in `src/components/Logo.astro` and `public/favicon.svg` is a placeholder. Swap in the official logo files.
- **Colours and fonts:** tokens at the top of `src/styles/global.css`.

## Forms

The admission enquiry and job application forms work in two modes:

1. **With a form service (recommended).** Copy `.env.example` to `.env` and set `PUBLIC_FORM_ENDPOINT`, for example to a [Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com) endpoint, then rebuild. Submissions are emailed to you and parents see a thank-you message. On Netlify / Vercel, set the variable in the project settings instead.
2. **Without one.** Submitting opens the visitor's email app with their details filled in, addressed to `admission@crossmaze.in` (or the careers email for job applications).

A hidden honeypot field filters out simple spam bots.

## Deploying

`npm run build` produces a static `dist/` folder that can be hosted anywhere:

- **Netlify / Vercel / Cloudflare Pages:** connect this repo. Build command `npm run build`, output folder `dist`.
- **GitHub Pages / any web host:** upload the contents of `dist/`.

Then point `www.crossmaze.in` at the new host.

## Please verify before launch

The live crossmaze.in could not be reached while this was built, so the content comes from public listings of the school. Please check:

- [ ] **Begur branch URL**: assumed to be `/branch/crossmaze-the-hub`. If the old site used a different slug, change it in `branches.ts`.
- [ ] **Ananth Nagar**: full street address and phone number (currently uses the main number).
- [ ] **Phone numbers per branch**: Neotown, Neeladri, SNN Greenbay and Ananth Nagar use +91 72599 21508; The Hub, Begur uses +91 72040 21508.
- [ ] **Centre heads**: only Neotown (Ms. Aishwarya) and Neeladri (Mrs. Pallavi Priya) are listed.
- [ ] **Founding year**: set to 2018 in `site.ts`. Public sources disagree.
- [ ] **Careers email**: currently `admin@crossmaze.in`.
- [ ] **Job descriptions**: the Teacher / Facilitator and Center Head descriptions are drafts. Day Care In-Charge follows the current careers page.
- [ ] **Program copy and FAQs**: check that they match how you describe your programs today.
- [ ] **Photos and logo**: add real centre photos and the official logo.
