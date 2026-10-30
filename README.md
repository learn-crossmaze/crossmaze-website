# Crossmaze website

The website for **Crossmaze Preschool and Day Care**, Bengaluru (www.crossmaze.in), with an **admin panel** at `/admin` for editing it and a connection that sends every website enquiry and job application to **LITMUS**.

- **Website:** a fast static site built with [Astro](https://astro.build), hosted on Firebase Hosting.
- **Admin panel:** staff sign in with their email and password to edit branches, programs, the logo, contact details, jobs, testimonials and page text, upload photos, and press **Publish**.
- **Forms → LITMUS:** every admission enquiry and job application is saved in Firebase (so nothing is lost), the visitor is thanked straight away, and it is then forwarded to LITMUS. If LITMUS can't take one, the full admins get an email with its details.

```
 Admin panel (/admin) ──saves──▶ Firestore + Storage ──Publish──▶ GitHub Actions ──▶ build ──▶ Firebase Hosting
                                                                    (pulls content + photos)
 Website forms ──POST /api/submit──▶ `submit` Cloud Function ──▶ Firestore "submissions" ──▶ `forwardSubmission` ──▶ LITMUS
                                                                                                      └─ fails ──▶ email to the admins (Zoho CPaaS)
```

## Pages

The URLs match the old site, so existing links and Google results keep working.

| URL | Page |
| --- | --- |
| `/` | Home: hero, stats, about, core values, programs, a day at Crossmaze, day care, facilities, testimonials, latest blog posts, branches, admission enquiry (with how admission works beside the form); on phones the programs, testimonials and branches are swipe strips |
| `/about` | Who we are, core values, approach, annual-day photos, and the founders once they are switched on in the admin panel |
| `/our-programs` | Play Group, Nursery, Junior KG, Senior KG, Day Care, how we teach, a day at Crossmaze, extra-curriculars, FAQs |
| `/branch` and `/branch/<slug>` | All branches, each with its area and short introduction, then one page per branch: photos, facts (including opening hours), programs with their batches and timings, about the centre with its amenities and centre head, gallery, then the visit details and map beside the enquiry form |
| `/careers` | Why work with us, open roles, application form with resume upload |
| `/contact` | Admission enquiry, phone / WhatsApp / email, how admission works, all branch addresses |
| `/privacy-policy`, `/terms` | Carried over from the old site (`src/pages/*.md`) |
| `/admin` | The admin panel (not indexed by search engines) |

## Using the admin panel

Go to **www.crossmaze.in/admin** and sign in (until the domain moves, step 6 below: **crossmaze-website.web.app/admin**).

| Section | What you can change |
| --- | --- |
| Site settings | Logo, school name, phone, emails, address, social links, colour theme, [festival greetings](#festival-greetings), home-page banner, numbers strip, about paragraphs (each with an optional subheading), quote, photos, founders (see below) |
| Branches | Add, hide, reorder or delete branches; name, area, short introduction (also shown on the Branches page), **Title in Google** (see [Search](#search-seo)), address, map, phone, **WhatsApp number** (empty: the phone; see below), size, capacity, amenities, programs offered, timings and batches (see below), photos (first = cover; the page shows six, and all of them open in a swipeable album), centre head with photo and bio |
| Programs | Add, hide, reorder; name, **Also called** (another name parents know it by, shown in brackets after the name on Our Programs and the program cards: “Junior KG (LKG)”; empty for none), age group, who can join (e.g. “2 years or older on 1 June”), icon, colour, photo, description, focus list (timings are set per branch) |
| Jobs | Open positions on the careers page |
| Testimonials | Parent quotes on the home page |
| Page sections | Core values, teaching approach, a day at Crossmaze, how admission works, day care highlights, extra-curriculars, facilities (with the photos for the scrolling strip on the home page), careers perks, FAQs |
| Submissions | Every enquiry and application; mark as handled, resend to LITMUS, export to CSV |
| Blog | Write posts with photos in six designs, keep them as drafts with a private preview link, then publish (see below) |
| Calls | Every tap on a call or WhatsApp button: which centre, page, device and how the visitor found the site; totals by centre; export to CSV (see below) |
| LITMUS | Where submissions are sent, its API key, and a **Send test** button |
| Email alerts | The Zoho CPaaS (formerly ZeptoMail) settings for the email the full admins get when a submission can't be sent to LITMUS, and a **Send me a test** button (see [Email alerts](#email-alerts-zoho-cpaas)) |
| Admins | Who can sign in: full admins, and branch admins (see below) |

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

### Founders

**Site settings → About page → Founders** lists the founders, each with a name, a role (such as "Co-founder"; leave it empty for none), a photo (a square portrait works best; without one, their initials are shown), a photo description and a few lines about them. They appear on the About page, a card each, and in what search engines read about the school, only while **Show the founders on the About page** is switched on; while it is off (as it is now) the website leaves them out entirely. Founders entered before this editor existed are just names: they open in it with that name, and are saved with their details from the next save on.

### Timings and batches

Each branch has its own timings: under **Branches → a branch → Timings and batches**, add one **batch** for each batch of each program the branch runs (two Play Group batches, full-day and half-day Day Care…). A batch has its program, an optional name (“Morning”; leave it empty when the program has only one batch there), start and end time, the days it runs and an optional seats label (“Few seats left” or “Full”; keep it up to date or leave it off).

Timings appear **only on the branch's own page**: under “Programs and timings”, each program shows its batches, earliest first, and the facts at the top show when the branch is open. Until every batch has its days, that is one range from the earliest start to the latest end; once they all have days, it shows the hours for each group of days (“Mon – Fri 9:00 am – 7:00 pm, Sat 9:00 am – 6:00 pm”), and the page tells Google the same opening hours. A batch must end after it starts, and the admin panel won't save half-filled ones; batch programs are limited to the programs the branch offers. When a program runs in more than one batch, the enquiry form on that page asks which batch the parent prefers, and the choice reaches Submissions and LITMUS as `batch`. Other pages (the footer, Contact) don't show timings; on Our Programs, each program links to the pages of the centres that run it (`/branch/<slug>#timings`), next to its **Who can join** line (admin panel → Programs → Who can join, e.g. “2 years or older on 1 June”).

The branches start with the timings the site showed before (9:00 am – 12:30 pm for the preschool programs, 9:00 am – 6:00 pm for day care), without days; replace them with each branch's real batches. A program a branch offers with no batch shows “Call us for timings”.

The batch choice in the enquiry form and branch admins editing timings need the database rules and functions from step 3 below (`npx firebase-tools deploy --only firestore,storage,functions`). Until then, the form still sends enquiries, just without the batch.

### Branch admins

A **branch admin** gets a small part of the panel: **Blog** and **Your branch**, plus the **Publish** button. They can write, edit, publish and delete their own blog posts (not other people's), and change the timings and batches and the centre head's name, photo and biography for the branches ticked for them. They can't see enquiries, calls, LITMUS, the admin list or any other content, and the security rules enforce this, not just the menu.

Add one on **Admins → Branch admins**: their email and the branches they look after (none means blog only). They sign in at /admin the same way as other admins. **Branches** on their row changes their branches; they see the change the next time they sign in. Removing a branch admin keeps their posts, and full admins can edit those posts like any other. Full admins see who wrote each post in the Blog list.

Branch admins need the database rules and functions from step 3 below (`npx firebase-tools deploy --only firestore,storage,functions`). Until those are deployed, a branch admin who signs in sees “No access yet”.

### WhatsApp

There is no school-wide WhatsApp number: each centre has its own (**Branches → WhatsApp number**, e.g. +91 73380 45201; empty uses the centre's phone number). However it's typed (with or without +91, a leading 0 or spaces), the site turns it into the right WhatsApp link and shows it like the phone numbers. The WhatsApp buttons on the home page, Contact and the round green button in the corner open a list of the centres, like the call buttons do, so parents pick theirs. On a centre's own page the green button opens a chat with that centre straight away.

### Calls

A website can't see who phoned or whether the call got through: tapping a call button just hands the number to the phone's dialler. What the **Calls** page shows is every tap on a call or WhatsApp button, with:

- the centre whose number was tapped, and where (the page, and the spot on it, such as a branch card or the “Call a centre” or “WhatsApp a centre” pop-up);
- the kind of device (phone, tablet or computer);
- how the visit started: a search (google.com), a social site, an ad (`utm_` tags or Google Ads), or “Direct”.

Several taps in one visit count as one person. Nothing that identifies the visitor is stored (no phone number, name or IP address), and taps from preview links aren't counted. Compare the counts with the centres' own call logs to see how many website visitors got through. The Dashboard shows the number of taps in the last 7 days.

To know who called (their number) you'd need call-tracking numbers from a telephony provider, shown on the website in place of the centres' own numbers.

### Colour themes

The site has seven colour themes: **Pastel Glass**, **Sunny Meadow**, **Ocean Breeze**, **Crayon Box**, **Montessori Calm**, and two bright ones, **Candy Pop** and **Tropical Splash**. Each theme changes the page background, colours, fonts and the little doodles in the banners and page margins (clouds and kites in Pastel Glass, butterflies and bees in Sunny Meadow, whales and starfish in Ocean Breeze, paints and crayons in Crayon Box, wooden toys and leaves in Montessori Calm, sweets in Candy Pop, and fruit, palms, flamingos and toucans in Tropical Splash); the boxes on top (cards, the floating header, the footer, forms and pop-ups) are white frosted glass in every theme, or smoky dark glass in dark mode (below). In **Site settings → Look and feel**, choose which one visitors see:

| Setting | What visitors see |
| --- | --- |
| The same theme every day | The theme you pick under **Theme** |
| A set theme for each day of the week | The theme you pick for that weekday |
| A different theme each day, in turn | Everyone sees the same theme on a given day; it moves to the next ticked theme each day |
| A random theme on every visit | A random ticked theme each visit, never the same as that visitor's last one |
| A random theme for each new visitor, kept on their repeat visits | A random ticked theme on someone's first visit, then the same one whenever they come back |

A visit keeps one theme from page to page. To look at a theme yourself, add `?theme=meadow` (or `pastel`, `ocean`, `crayon`, `calm`, `candy`, `tropical`) to any page address; `?theme=auto` goes back to the setting. Like other changes, a new setting goes live when you press **Publish**.

**Dark mode.** Every theme also has a dark version: a deep night-time gradient in the theme's own colours, with smoky glass boxes and light text; buttons, badges and headings keep their bright gradients. **Site settings → Look and feel → Dark mode** chooses who sees it:

| Setting | What visitors see |
| --- | --- |
| Follow each visitor's phone or computer, with a light/dark button | Dark when their device is set to dark mode, light otherwise. The sun/moon button in the menu bar switches, and the site remembers their choice |
| Light, with a button to switch to dark | Light, until they press the sun/moon button (remembered) |
| Light only | Light; no button |

To look at dark mode yourself, add `?mode=dark` to any page address (it works even when dark mode is off, so you can check it first); `?mode=light` shows light and `?mode=auto` goes back to the setting. Combine them: `?theme=ocean&mode=dark`. The admin panel itself stays light.

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

The first deploy that includes `forwardSubmission` (the function that sends each saved submission to LITMUS) also sets up Firestore events for the project. If it stops and asks you to retry in a few minutes, wait and run the same command again.

### 4. GitHub repository settings (Settings → Secrets and variables → Actions)

- **Secret** `FIREBASE_SERVICE_ACCOUNT_CROSSMAZE_WEBSITE`: a service-account key (Firebase console → Project settings → Service accounts → **Generate new private key**; paste the whole JSON file). Then give that account (`firebase-adminsdk-…@crossmaze-website.iam.gserviceaccount.com`) these roles in Google Cloud console → **IAM & Admin → IAM** → pencil icon: **Firebase Admin**, **Cloud Run Viewer** and **API Keys Viewer**. The deploy needs them to read content, download photos and publish the site.
- **Variable** `ADMIN_EMAILS`: your email (comma-separate several). These people are added as admins on the next deploy.
- **Variable** `FIREBASE_STORAGE_BUCKET`: only if your bucket isn't `crossmaze-website.firebasestorage.app`.

### 5. First deploy

Merge this branch into `main`. The first deploy copies the current website content and photos into Firestore and Storage, adds the `ADMIN_EMAILS` admins, and publishes the site. After that, **the admin panel is the place to edit content**: the `content/*.json` files in the repository are only the starting copy.

Then go to `/admin`, choose **Create an account** with one of the `ADMIN_EMAILS`, and click the verification link Firebase emails you (check spam). After that, sign in normally. New admins you add on the Admins page do the same.

### 6. Point the domain

crossmaze.in is registered at **GoDaddy**, but its DNS (the records saying where the website and the email live) is run by **Wix**: GoDaddy points the domain at Wix's nameservers `ns6.wixdns.net` and `ns7.wixdns.net`. The move happens in two separate evenings, so only one thing changes at a time:

1. **Evening 1: DNS moves to GoDaddy** (done 25 October 2026). The records the school uses, rebuilt at GoDaddy; the website still shows the old Wix site.
2. **Evening 2 (2 days to 2 weeks later): the website moves** (done 26 October 2026: www.crossmaze.in served the new site with its own certificate about 30 minutes after the change, and crossmaze.in forwarded to it a few minutes later). Two records at GoDaddy change to the new site.

The email is on **Zoho** (US data centre, zoho.com) and keeps working throughout: its records are copied exactly and never edited. **`www.crossmaze.in` is the main address**; `crossmaze.in` redirects to it, as it does today. The site, sitemap and LITMUS already use www, so no code changes at the switch. Old Wix addresses that people or search engines know are redirected in `firebase.json` (`/home`, the Wix sitemaps, `/admission`, `/transport`, `/onboarding`, `/onboarding-staff`), and the Google, Bing and Facebook verification tags from the Wix home page are in `BaseLayout.astro`, so those accounts stay verified. The old Wix parent feedback forms (`/feedback`, `/feedback/ptm`, `/feedback/sports-day`…) and transport requests go to LITMUS's parent portal, its staff forms (`/feedback/employee`, employee onboarding) to the staff portal, and its back-office pages (`/admin/…`, `/documents`, payments) to LITMUS's sign-in; `www.crossmaze.in/admin` itself becomes the website's admin panel.

**The records**: [`dns/crossmaze.in.zone`](dns/crossmaze.in.zone) is the master copy, 18 records checked against Wix's list and live DNS:

| Records | What they are |
| --- | --- |
| A `@` → `185.230.63.107`, CNAME `www` → `pointing.wixdns.net` | The website: the old Wix site (Wix's values for DNS hosted elsewhere) until evening 2 |
| MX `@` 10 `mx.zoho.com`, 20 `mx2.zoho.com`, 30 `mx3.zoho.com`; TXT `@` `v=spf1 include:zoho.com include:zohomail.com include:sender.zohobooks.com ~all` | Where email is delivered, and who may send as @crossmaze.in (the only `v=spf1` record) |
| TXT `zoho._domainkey`, `1522905413783._domainkey`, `1121755._domainkey` | Zoho Mail, Zoho Books and ZeptoMail (now Zoho CPaaS) signature (DKIM) keys |
| CNAME `bounce-zem`, `zb15474756`, `mail`, `forms` | ZeptoMail (now Zoho CPaaS) bounces, Zoho's domain verification, Zoho webmail and Zoho Forms |
| TXT `_dmarc` `v=DMARC1; p=none;` | Email policy: no enforcement, as today |
| CNAME `litmus`, `staging`; TXT `_acme-challenge.staging`, `_acme-challenge.app` | LITMUS |

Wix's own email records are not copied: the CNAMEs `s1._domainkey`, `s2._domainkey`, `sel1._domainkey`, `sel2._domainkey` and `sg` only let Wix send newsletters and automatic replies as @crossmaze.in (Zoho uses none of them), and Wix's `_dmarc` CNAME (to `_dmarc.wixemails.com`, the same `p=none` but with reports going to Wix's supplier) is replaced by your own TXT.

**Never** edit the email rows, use Zoho's “Log in to my DNS” (it rewrites them), press **Add Forwarding** at GoDaddy (it moves the nameservers at once and locks the A record), or accept a GoDaddy offer to set up email, a website or a “connection” for crossmaze.in.

**How GoDaddy's record forms work**: **Name** is the part before `.crossmaze.in` (`zoho._domainkey`, `www`…); `@` is the domain itself. Paste values without quotes, without a full stop at the end and without `https://`; an MX's priority goes in its own box. TTL: **1/2 Hour** for the A `@` and www rows, **1 Hour** for the rest.

**Before evening 1**

1. Keep screenshots of Wix → Domains → crossmaze.in → Manage DNS records and of Zoho Mail Admin (mailadmin.zoho.com) → Domains → crossmaze.in → Email Configuration (MX, SPF, DKIM, all green).
2. Export what the old Wix site holds (Forms submissions, Contacts, the CMS collections) and its list of redirects (Wix dashboard → **SEO** → **Tools and settings** → **URL Redirect Manager** → **More Actions → Export redirects**; any old address not yet in `firebase.json` can then be added before evening 2). Check the Wix Premium plan's end date (Premium Subscriptions): it has to last until two weeks after evening 2, because undoing evening 2 sends the website back to it. In Wix → **Automations** switch off only the ones that email parents or other visitors (such as a thank-you to parents who fill in the old enquiry form), and in **Email Marketing** cancel any scheduled campaign: from evening 1 Wix can no longer sign those emails as crossmaze.in, so they could land in spam. Leave on the ones that email you or your team when a form is submitted: Wix sends those from its own address (notifications@wix-forms.com), so enquiries from the old form keep reaching you.
3. GoDaddy: 2-step verification on (for at least a day), the account's email address not an @crossmaze.in one, nothing in **My Products** (email, website builder, email forwarding) linked to crossmaze.in, and crossmaze.in → DNS → **Forwarding** showing “Not set up” with only **Add Forwarding** buttons (look only; never press them). If a forward is listed there, delete it on evening 1 straight after step 5, before step 6.
4. GoDaddy → Domain Portfolio → **Settings → DNS Templates → Add**: name it `crossmaze-zoho`, **Add individual records**, and enter the 18 records from `dns/crossmaze.in.zone`. If GoDaddy refuses any row, stop and ask for help rather than changing the value. Press **Save**, never Apply, and compare the finished list with the file: each DKIM key must begin and end exactly as on its row. Then download the file to the computer you'll use on evening 1 (on GitHub, open `dns/crossmaze.in.zone` → **Download raw file**) for step 7's fallback.

**Evening 1: move the DNS** (one sitting of about 15 minutes, phone at hand for the codes)

5. GoDaddy → crossmaze.in → **DNS → Nameservers → Change Nameservers → GoDaddy Nameservers (recommended)** → Save, tick the box, Continue, enter the code. Note the two `…domaincontrol.com` nameservers it now shows. Many networks follow within 15–30 minutes, so go straight on.
6. **DNS Records**: take a photo of what GoDaddy has put there (if the page still says it can't display your DNS information, refresh after a minute; only if it still says so 10 minutes after the switch, undo as in step 8). If a service name with **Remove** shows above the list, remove it. Then **Actions → Apply DNS Template → crossmaze-zoho → Overwrite existing records** → Apply.
7. Compare the list with the file: the 18 records, plus GoDaddy's own NS and SOA (and possibly `_domainconnect`, which can stay). Delete anything else: an A record shown as “Parked” or “WebsiteBuilder Site”, `www` → `@`, an MX on secureserver.net or outlook.com, a second `v=spf1`, any `_dmarc` TXT except your own `v=DMARC1; p=none;` (GoDaddy's says `p=quarantine` and `onsecureserver.net`), `email` or `ftp` CNAMEs. There must be exactly one A `@` (`185.230.63.107`) and exactly one `_dmarc` record. If the template can't be applied: delete every record in the list except NS, SOA and `_domainconnect` (an import only adds records and fails on any clash, and a GoDaddy MX left in place would take Zoho's mail), then **Actions → Import Zone File** with the downloaded `crossmaze.in.zone`, and compare again.
8. If something isn't right and can't be fixed within 10 minutes of the switch, undo: **Nameservers → Change Nameservers → I'll use my own nameservers** → `ns6.wixdns.net` and `ns7.wixdns.net`. Wix still has every record, so this restores everything.
9. Straight after step 7, check what GoDaddy itself gives out (the other checks tonight may still read Wix's copy, which has the same website and Zoho records, so they can't catch a mistake at GoDaddy). On https://www.digwebinterface.com, under Nameservers choose **Specify myself** and type the first `…domaincontrol.com` nameserver from step 5. Put the names in **Hostnames**, one per line, pick the **Type** and press **Dig**: `crossmaze.in` with Type MX (the three Zoho rows); `crossmaze.in`, `_dmarc.crossmaze.in`, `zoho._domainkey.crossmaze.in`, `1522905413783._domainkey.crossmaze.in` and `1121755._domainkey.crossmaze.in` with Type TXT (exactly one `v=spf1`; for `_dmarc` exactly one answer, `v=DMARC1; p=none;`, and nothing saying `p=quarantine` or `onsecureserver.net`; and each key exactly as in the file, ending `IDAQAB`); `www.crossmaze.in`, `mail.crossmaze.in` and `bounce-zem.crossmaze.in` with Type CNAME. Every answer must match the file. If a lookup comes back empty, Dig again 5 minutes later; if a value is wrong, fix that record at GoDaddy or undo (step 8).
10. Half an hour later: https://www.crossmaze.in still opens the old site; https://mail.crossmaze.in, https://forms.crossmaze.in and https://litmus.crossmaze.in open. In Zoho Mail Admin → Email Configuration press Verify on MX, SPF and DKIM (all green), send a mail from an outside Gmail to admission@crossmaze.in and reply from Zoho, and send a test enquiry from the old site's form and check that Wix's alert reaches your inbox. Tonight https://dns.google/resolve?name=crossmaze.in&type=NS may still show `wixdns.net`, or switch between the two pairs when you refresh: networks remember Wix's answer for up to a day, and Wix still has the same website and Zoho email records. That is normal and no reason to undo, as long as GoDaddy's Nameservers page lists the `domaincontrol.com` pair. Do these checks again the next day and the day after, and for a month look at GoDaddy's DNS Records page once a week for anything new that GoDaddy adds itself, such as an MX on secureserver.net or a second `_dmarc` with onsecureserver.net, and delete it (keep NS, SOA, `_domainconnect` and the records you add in steps 12 and 13). If a check fails after tonight, don't switch the nameservers back (step 8 is only for the first evening): compare GoDaddy's list with the file again, as in step 7, and edit, add or delete the row that differs (copy values from the file). Until evening 2, change nothing in Wix's domain settings (switching off an automation or campaign, as in step 2, is fine); at GoDaddy add only the TXT records of steps 12 and 13; and ignore anything Wix suggests (“reconnect”, “use Wix nameservers”, “Unassign”, “Reset”).

**Before evening 2** (at least 2 days after evening 1, when https://dns.google/resolve?name=crossmaze.in&type=NS and https://www.digwebinterface.com/?hostnames=crossmaze.in&type=NS&ns=all&short=on show only `domaincontrol.com` names, no `wixdns.net`; and before about 20 November 2026, when the old site's certificate is due to renew)

11. Firebase console → **Authentication → Settings → Authorized domains**: make sure `crossmaze.in` and `www.crossmaze.in` are listed (the admin panel's sign-in only works on listed domains).
12. Firebase → **Hosting → Add custom domain** → `crossmaze.in`, tick **Redirect to** `www.crossmaze.in` → **Advanced setup**, **DNS**. Do this one first: proving you own `crossmaze.in` proves `www` too. At GoDaddy add two new TXT records: `@` `hosting-site=crossmaze-website` (exactly as Firebase shows; a second TXT `@` beside the SPF, never merged into it; keep it for good, Firebase renews the certificate with it) and `_acme-challenge` with the token. Half an hour later, https://dns.google/resolve?name=crossmaze.in&type=TXT must show two separate values next to `"data":`, the SPF exactly as in the file and `hosting-site=…`. If the SPF has gone or changed, fix it at GoDaddy at once (one TXT `@` row holding exactly the SPF, `hosting-site=…` in a row of its own); if only `hosting-site` is missing, wait and check later, without adding it twice. Then press **Verify** (again an hour later if Firebase can't find the records yet; if it shows a new `_acme-challenge` value, **edit** that row at GoDaddy and Verify again), and wait until **crossmaze.in → View** has moved from **Prepare domain** to **Direct to Hosting**. The changes that screen lists are evening 2's.
13. **Add custom domain** → `www.crossmaze.in` (leave “redirect” unticked) → **Advanced setup**, the **DNS** challenge. At GoDaddy add TXT `_acme-challenge.www` with the code Firebase shows, and press **Verify** half an hour later, so www's certificate can be ready before evening 2. If Firebase lists a `hosting-site=…` TXT whose host is `www.crossmaze.in`, skip it: www holds a CNAME, which can't share its name, and changing that CNAME on evening 2 completes the setup (until then Firebase may show www as **Needs setup**). Firebase doesn't wait for ever for a domain to be connected, so hold evening 2 within two weeks of these steps.

**Evening 2: move the website** (about 15 minutes, a quiet evening)

14. GoDaddy → DNS Records: **edit** the A `@` record from `185.230.63.107` to the IP Firebase shows (today `199.36.158.100`). Keep exactly one value; don't delete the record, even if Firebase lists it under “remove”.
15. **Edit** the `www` CNAME from `pointing.wixdns.net` to `crossmaze-website.web.app`, even if Firebase's screen for www asks for an A record: the CNAME reaches the same servers and proves ownership. Change nothing else. (Only if Firebase still won't connect www hours later: delete the `www` CNAME and add an A `www` record with the same IP as `@`.)
16. Refresh Firebase → Hosting until both domains say **Connected** (minutes to a couple of hours, at most 24). Until www does, https://www.crossmaze.in may show the old site, an error page or a “Your connection is not private” warning on some devices: normal, change nothing. If the new site itself is broken, or www still isn't Connected 3 hours later, undo: A `@` back to `185.230.63.107` and `www` back to `pointing.wixdns.net` (the old Wix site returns within about 30 minutes; never Unassign the domain in Wix, which this relies on).

**After**

17. https://www.crossmaze.in shows the new site with a padlock; http://crossmaze.in, https://crossmaze.in and http://www.crossmaze.in all end there. /home goes to /, /admission to LITMUS.
18. Sign in again at www.crossmaze.in/admin (sign-ins are kept per address). Send a test enquiry from /contact and check Submissions and LITMUS. On your phone, tap Call on the site and pick a centre (you don't need to make the call), then check the tap appears on the admin's Calls page.
19. Email: from an outside Gmail, write to admission@, care@ and admin@crossmaze.in and reply from Zoho. In Gmail on a computer, open each **reply that came from Zoho** → **⋮** → **Show original**: SPF, DKIM and DMARC should say PASS. Zoho Admin → Email Configuration: Verify on MX, SPF and DKIM.
20. Google Search Console: submit `https://www.crossmaze.in/sitemap-index.xml`. Update the website link on each centre's Google Business Profile, Facebook and Instagram. Update `dns/crossmaze.in.zone` with the two new website rows and the Firebase TXT records.

**Leaving Wix** (done 26 October 2026, the evening of the switch; the plan was at least two weeks after evening 2): Wix → Domains → crossmaze.in → **Remove from Wix**, then cancel the Premium plan (and any other Wix subscription, such as business email). Nothing changes at GoDaddy: Wix's own records were never copied there.

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
    "program": "Nursery", "branch": "Crossmaze – Neotown", "batch": "Morning · 9:00 am – 12:30 pm", "message": "…"
  }
}
```

Job applications send `name, phone, email, position, branch, experience, qualification, resume_link, resume_file, about`. `resume_link` is a private link to the resume the applicant uploaded (PDF, Word or a photo, up to 5 MB) and `resume_file` is its file name. The file is stored in Cloud Storage under `resumes/`; only admins can open it in the panel, and anyone given the link can download it, so treat the link like the resume itself. Deleting an application in Submissions also deletes its resume. LITMUS should reply with any 2xx status. Failed deliveries are retried every 30 minutes (up to 6 times), shown as “LITMUS failed” in Submissions, emailed to the full admins (see below), and can be resent by hand. Submissions that arrive before LITMUS is set up are kept, and **Send unsent to LITMUS** delivers them later.

The website doesn't wait for LITMUS: `submit` saves the submission (and the resume) and thanks the visitor at once, and `forwardSubmission` sends it to LITMUS a moment later, when Firestore tells it a submission was saved. A submission still “Sending…” after 10 minutes (if `forwardSubmission` didn't run) is picked up by the 30-minute retry.

The form fields and validation live in `functions/lib/forms.js`; the delivery code is `functions/lib/litmus.js`.

### Email alerts (Zoho CPaaS)

When a submission can't be sent to LITMUS, every full admin (admin panel → Admins, not branch admins) gets one email with everything the visitor filled in, the page and a link to Submissions, so the school can call them back while the website keeps trying. It is sent once per submission, not on every retry (again only if that email failed), and the submission's LITMUS card in Submissions says whether the admins were emailed. Alerts go through [Zoho CPaaS](https://www.zoho.com/cpaas/), Zoho's service for emails sent by websites and apps, called ZeptoMail until 2026 (accounts, Agents, keys and verified domains carried over). The code is `functions/lib/zeptomail.js` and `functions/lib/alerts.js`.

To set it up (the school's Zoho account is in the US data centre, so Zoho CPaaS is at cpaas.zoho.com):

1. In Zoho CPaaS → **Agents**, open the agent (or add one, e.g. `Crossmaze website`) and check that **crossmaze.in** shows as verified under **Domains**. crossmaze.in already has the records from its ZeptoMail days (the `bounce-zem` CNAME and a DKIM key, in `dns/crossmaze.in.zone`), so it should be. If Zoho CPaaS asks for a record that isn't there, add it at GoDaddy and to `dns/crossmaze.in.zone`, and don't change the existing email records.
2. In the same agent → **SMTP/API** → **API Setup**, copy the **Agent key** (the API key; a ZeptoMail Send Mail token still works) and the API address (`https://cpaas.zoho.com/v1.1/email`; ZeptoMail's `https://api.zeptomail.com/v1.1/email` also still works).
3. In the admin panel → **Email alerts**: tick **Email the admins…**, paste the key, enter the From address (on crossmaze.in, e.g. `noreply@crossmaze.in`) and press **Save**, then **Send me a test**. The test goes to the admin who presses it; check the inbox and the spam folder.

The key is kept in Firestore at `private/zeptomail` (the name from before the rename), which only full admins can read (the website and branch admins can't). With Email alerts off, failures are only shown in Submissions.

## Festival greetings

On 31 festivals and special days the website greets visitors by itself, with nothing to do on the day:

- **National days:** New Year, Republic Day, Independence Day, Gandhi Jayanti, Kannada Rajyotsava.
- **School and children's days:** Women's Day, World Health Day, Earth Day, Mother's Day, World Environment Day, Father's Day, International Yoga Day, Doctors' Day, National Sports Day, Teachers' Day, Children's Day.
- **Festivals:** Makar Sankranti and Pongal, Holi, Ugadi, Good Friday, Ram Navami, Mahavir Jayanti, Eid al-Fitr, Raksha Bandhan, Janmashtami, Onam, Ganesh Chaturthi, Dussehra, Diwali, Guru Nanak Jayanti, Christmas.

**What visitors see, only on the day (India's date):**
- A slim glass bar at the top of every page: the greeting, a short wish and a **See our card** button. Closing it hides it for the rest of the day.
- The pop-up opens from **See our card** and, on the home page, by itself 5 seconds after the page opens (once a day for each visitor; not while they are typing in a form, or after they closed the bar):
  - **Left:** that year's card, with **Share on WhatsApp** and **Download**. On phones, sharing sends the picture itself; on computers it opens WhatsApp with a link, and the card can be downloaded.
  - **Right:** what the day is about, what little ones can learn from it, a **Try this at home** activity, a link to the school's blog post about last year's celebration (when there is one with the festival's name in its title), and **Admissions are open for 2027–28** with a **Book a school visit** button.
- **The admissions year** works itself out: until October it is the current year, and from November the next one. It is never shown on Good Friday, which has a quiet card and words.

**Every year is different.** Each day has at least two card designs that take turns by year. The arrangement (how many kites, where the balloons are) is worked out from the year, and the colours follow the website's colour theme of the day. Wishes and activities also take turns. Nobody draws or uploads anything: the browser draws the card when the page opens.

**Dates:**
- Fixed dates and Mother's/Father's Day (second/third Sunday) are worked out by the site.
- Festivals that move each year come from Google's public calendar of Indian holidays. Every build reads it (`scripts/festival-dates.mjs`) into `src/greetings/dates.json`, which is kept in the repository with dates to 2031. So greetings keep working even if Google can't be reached or nobody publishes for years.
- Islamic dates (Eid) are provisional until the moon is sighted; a later publish picks up Google's corrected date.

**Settings:** admin panel → Site settings → **Festival greetings**:
- switch greetings off;
- hide the admissions line;
- stop the card opening by itself on the home page, or change how many seconds it waits;
- see every greeting for this year or the next two before the day, and untick **Show on the website** for any day the website should skip; under each card, **Try another** shows the day's other drawing arranged afresh (click again for more), **Words on the card** replaces the wish, and **Upload my own picture** puts a photo of your own behind the logo and greeting panel. **Use this card** keeps the change for that year only (next year starts automatic again) and **Back to automatic** undoes it: admin panel → **Festival greetings** (full admins only; there is no public preview, so nobody sees a greeting early). Like other settings, a change reaches the website when you press **Publish**; there is no nightly job, because each visitor's browser checks the date itself.

**Code:** `src/greetings/` holds the list of days (`occasions.ts`), the words (`text.ts`), the drawings (`designs/`), the card (`card.ts`) and the pop-up (`ui.ts`); the bar is `src/components/Greetings.astro`. The card fonts (Fredoka and Nunito, SIL Open Font License) are in `public/fonts/`.

To add a day:
1. Add it to `occasions.ts` (a fixed date, or its name as Google's calendar writes it).
2. Add its words to `text.ts`.
3. Add at least two designs to a file in `designs/`.

Link previews when the site is shared keep the usual picture: changing them on the day would need a scheduled rebuild, which would also publish admin edits that were saved but not yet published.

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
- A field that's new in `content/site.json` or `content/sections.json` (such as a new page section) is copied into Firestore on the next deploy from `main`, so it appears in the admin panel. Pull-request previews use the repository's copy without writing to Firestore. A new field on the items of a list (branches, programs, jobs) is not copied: it is empty until someone fills it in the admin panel, unless a content update (below) gives it a value, as `2026-10-26-program-also-called` does for Junior KG's and Senior KG's **Also called** (an update from an empty field applies only while the field has never been set; one cleared in the admin panel counts as edited).
- Founders (`founders` in `content/site.json`) used to be a list of names, and the live database keeps those names until Site settings is next saved. A name is read as a founder with only a name by the site (`src/data/founders.ts`), the admin panel (the field's `fromText` in `src/admin/schemas.ts`) and `scripts/sync-content.mjs`, so both shapes work. A content update that changes the founders compares them the same way (a name, a founder saved without its empty fields and the repository's copy with every field all match), so it applies unless someone has changed them in the admin panel. `showFounders` was added later too: deploys from `main` copy it into Firestore switched off.
- **Changing existing copy from the repository** (reworded text, a corrected phone number) needs a content update, because the live text is in Firestore and each deploy overwrites `content/*.json` with it. Edit the JSON, then run `node scripts/content-update.mjs <id> "<what changed>"` before committing (it compares with the last commit; pass another git ref as a third argument, e.g. `origin/main`). It writes `content/updates/<id>.json`, one entry per changed field. Pull-request previews show the change without saving it. The next deploy from `main` saves it to Firestore once, and only where Firestore still has the old text, so anything edited in the admin panel is kept. The deploy log lists what was updated and what was kept. Photos inside a list that changes as a whole (such as each facility's photo) are included and copied to Cloud Storage when the update is saved; other photo fields and new items, such as a branch or a job, are added in the admin panel.
- `scripts/report-publish.mjs` tells the admin panel whether a deploy succeeded.
- Colour themes: the tokens in `src/styles/global.css` are Pastel Glass; `src/styles/themes.css` overrides them for the other themes, and `src/data/themes.ts` lists each theme's fonts and browser-bar colours. A script at the top of `layouts/BaseLayout.astro` picks the theme and light or dark (`<html data-theme="…" data-mode="light|dark">`) in the browser before the page is drawn. Dark colours: `:root[data-mode='dark']` in global.css (Pastel Glass at night, plus the smoky glass and shadows every theme shares) and `:root[data-theme='…'][data-mode='dark']` in themes.css, which must re-set every colour token the theme's light block sets.
- Doodles: each theme draws its own set in `src/components/doodles/<theme>.ts` (the slots are described in `shared.ts`: 4 for the home banner, 3 for other banners, 6 for the sections, and the home title's underline), listed in `themeDoodles` in `src/components/doodles/index.ts`. The build turns every drawing into a small file, `/doodles/<hash>.svg` (named after its content, so it can be cached for good), and the CSS that picks the current theme's set by day or at night. Check a set with `npm run dev` and `?theme=<id>&mode=light|dark`.
- The admin panel lives in `src/admin/`. Its forms are generated from `src/admin/schemas.ts`, so adding a field there and in `src/data/content.ts` is all it takes.
- Who can do what is decided by `firestore.rules` and `storage.rules`: full admins are listed in `admins/{email}`, branch admins in `branchAdmins/{email}` (`branches`: the branch slugs whose `centerHead` they may change). Blog posts record their writer in `createdBy`. The panel's menu (`NAV` in `src/admin/AdminApp.tsx`) only hides pages; the rules are what stop a branch admin, so test them with `npm run test:rules`.

## Search (SEO)

What the code does, from the content in the admin panel:

- **Titles** name the service and the place. About 60 characters show in Google.
  - Home page: “Crossmaze Preschool & Day Care in Electronic City & Begur, Bengaluru”.
  - Each branch page: “Preschool & Day Care in <area> | Crossmaze”, with “, Electronic City” added when the address is there but the area doesn't say so (the short name stands in for an empty area). A title over 65 characters is shortened until it fits: a long area keeps its first and last parts (“Neotown, Electronic City”), then the short name stands for the area (“SNN Greenbay, Electronic City”), then “ | Crossmaze” goes (Neeladri Nagar). The branch's **Title in Google** overrides all of this.
  - Branches, Our Programs, About, Careers and Contact have their own titles (“Preschool & Day Care Centres in Electronic City & Begur”, …). Our Programs uses the programs' other names (“LKG”, “UKG”) in place of their names, so an **Also called** should be a name parents search for.
  - Other pages: “<page> | Crossmaze”.
- **Descriptions** come from the page's own facts: each branch page's from its area, programs, opening hours (when its facts show one range) and phone, leaving out the days and then the hours when it would be over 160 characters; Contact's from the main phone and admissions email. The home page's is **Site settings → Description for Google** (Google shows about 155 characters of it).
- **Headings**: on the home and branch pages, the small lines above the title (“Preschool & Day Care”, then the place: “Neotown, Thirupalya” / “Electronic City · 560099”) are part of the page's main heading, which reads “Preschool & Day Care, Neotown, Thirupalya, Electronic City · 560099 Crossmaze – Neotown”. They are one under the other at every width, so the heading doesn't change height when the web font arrives.
- **Structured data** (what Google reads about the school, `BaseLayout.astro` and the pages): the school (`Preschool`, with its logo, main phone and main address), the website's name (home page), each centre (`Preschool` and `ChildCare`, with its own phone, address, map position, photos and, once every batch has its days, opening hours) linked to the school, the breadcrumbs on every page that shows them, and blog posts with their cover photo. The sitemap (`/sitemap-index.xml`) lists every page.

What stays with the school (the website can't do these):

- **Google Search Console** (the property verified through the old Wix tag, kept in `BaseLayout.astro`, and since 27 October 2026 a Domain property verified by the `google-site-verification` TXT row in `dns/crossmaze.in.zone`): submit `https://www.crossmaze.in/sitemap-index.xml`, ask Google to recrawl the home page and the branch pages after a deploy (URL Inspection → Request indexing), and check a branch page and a blog post in Google's Rich Results Test.
- **Google Business Profiles**: one per centre, claimed and verified by the school, with the same name, address and phone as its branch page, and the branch page as its website.
- **Directories** (Justdial, cretaclass and others) that still give an old address or number, such as Neeladri Nagar's old Malligue Residency address and +91 99020 68692, which the site doesn't use: ask them to correct it.
- **Opening hours for Google**: tick the days of every batch at a centre (Branches → Timings and batches); until then its page gives Google no opening hours.
- **Description for Google** (Site settings) is 216 characters; Google shows about 155, so a shorter one reads better.

## Confirmed by the school

On 19 October 2026 the school confirmed the following, so the site states them. Keep them in line with any later change:

- **Age for each class**: counted on 1 June: Play Group from 2 years, Nursery from 3, Junior KG from 4, Senior KG from 5. Day care is for 2 to 8 years, with or without a Crossmaze class.
- **Play Group**: children don't need to be toilet trained; staff change nappies and help with toilet training.
- **Food**: children bring a packed snack from home, and day care children a packed lunch too.
- **Day care**: a full day, after the morning class, after school for children from other schools (collected from the nearest drop point of their school bus), or on its own without a class. One adult for every six children, for the whole day, at every centre. Air-conditioned sleeping room and indoor play areas.
- **CCTV and the app**: every centre has CCTV, but the live view is for **day care parents only**. The Crossmaze Care parents' app is for every parent at every centre.
- **Senior KG**: no claim about school boards (State, CBSE, ICSE).

On 26 October 2026 the school also confirmed:

- **Timings and batches** on the branch pages are correct.
- **Facility photos**: the four stock photos (CCTV surveillance, Fire safe, Parents’ communication app, Trained caregivers) are licensed; the school bought them.
- **Enquiries** go to LITMUS, which sends the email alerts.
- **Feedback** from parents goes through the LITMUS parents portal; the old Wix feedback addresses redirect there.
- **Founders** are not shown on the website for now. They can be filled in later (admin panel → Site settings → About page: each founder's name, role, photo and a few lines), then switched on with **Show the founders on the About page** and published.

Later on 26 October 2026 the school confirmed:

- **Main phone**: +91 72599 21508 (admin panel → Site settings). It is the number search engines show for the school, and what Call buttons dial if the centre picker can't open. Each centre keeps its own number.
- **Main address**: the Neotown centre, in the **Kusumkunj** building: Kusumkunj, Site No 3/4, opposite G.M. Infinite, Thirupalya, Neotown, PIN 560099 (Site settings → Main address). Neotown's own address names the building too.
- **Neotown** is in **Electronic City**, near Thirupalya, in the **Kusumkunj** building (Site No. 3/4, opposite G.M. Infinite, Phase 1, as on the old site).
- **LKG and UKG**: Junior KG is also called LKG, and Senior KG UKG (admin panel → Programs → Also called). The programs keep their names, which the batches refer to.

On 27 October 2026 the school asked for:

- **WhatsApp per centre**: no common WhatsApp number (+91 72599 21508 is no longer used for WhatsApp). The WhatsApp buttons ask which centre, and a centre's own page goes straight to that centre (see [WhatsApp](#whatsapp)).

## Please verify before launch

- [ ] **Branch phone numbers, addresses and map pins** come from the branch records behind the old www.crossmaze.in: The Hub +91 72040 21508, Neotown +91 73380 45201, SNN Greenbay +91 72595 10758, Neeladri Nagar +91 97409 21508 and Ananth Nagar +91 87225 70895. Call each number once to check it reaches the right centre. Neeladri Nagar's address changed from "Malligue Residency, 16th Cross Road" to "128, Gargeshwari, 13th Cross Road", as on the old site.
- [ ] **WhatsApp at each centre**: until a centre has its own **WhatsApp number** (admin panel → Branches), its WhatsApp button uses the centre's phone number. Check that each of the five numbers above is on WhatsApp (or WhatsApp Business), or enter the right one.
- [ ] **Careers email**: now `career@crossmaze.in` (set in the admin panel). Send it one test email to make sure that mailbox exists in Zoho.
- [ ] **Small photos** look soft on large and high-resolution screens. The day care photo is still the old nap-room picture, only 555 px wide, some "Life at Crossmaze" photos are 450–500 px wide, and so are the school’s own facility photos from the old site (555 px; admin panel → Page sections → Facilities), which also open full screen. Upload larger originals (about 1200 px wide or more; admin panel → Site settings → Day care photo and “Life at Crossmaze” photos). The site picks up the larger sizes by itself.
- [ ] **Play Group photo description** still says "Colourful indoor play area with rockers and a slide", but the new photo shows children holding paper props. Update it in admin panel → Programs → Play Group → Photo description.
- [ ] **Home banner badge** "1000+ happy children" repeats the first number in the numbers strip just below it. Give the badge different words, or leave its number empty to hide it (admin panel → Site settings → Top banner).
- [ ] **Reworded copy** (October 2026): text across the site was rewritten for clarity without changing any facts. The FAQ "How do I apply for admission?" is new.
- [ ] **A day at Crossmaze** and **How admission works** were written for the new site from what the old site says. Check they match how your centres work (admin panel → Page sections).
- [ ] **Sample blog posts**: six example posts (one in each design) start as hidden drafts, written from what the site already says plus general parenting tips. Edit and publish the ones you like, and delete the rest (admin panel → Blog).
- [ ] **Program details still to add** (asked on 19 October 2026; the site leaves them out until the school answers):
  - What makes the **Foundational Development Program** Crossmaze's own: KLAY, whose Neeladri Road centre is close to Crossmaze Neeladri Nagar, uses the same name for its preschool. Add two or three lines on Our Programs ("How we teach").
  - **Senior KG**: what children can usually do by the end of the year (reading, writing, numbers), and any help with Class 1 admissions.
  - **Settling in** (especially Play Group): whether a parent can stay at first, and whether the first days are shorter.
  - **Languages**: the main language in class, and whether Kannada or Hindi is taught, from which class.
  - **Progress**: how parents hear how their child is doing (app updates, parent-teacher meetings, report cards).
  - **Joining mid-year**: which classes take children partway through the year; whether day care can start any time.
  - **Day care's visiting instructors** (art, craft, dance; "additional charges may apply") and **"qualified staff"** on Play Group: still offered, and do all teachers hold the early-childhood certificate the careers page asks for (NTT, Montessori, ECE or CIDTT)?
- [x] **Leaving Wix** (26 October 2026): the domain was removed from Wix the evening of the switch, the old Wix site stays on its free Wix address with search engines turned off (SEO Settings → Hide Site), and its form submissions and contacts remain in its Wix dashboard. Moving the website back to Wix is no longer possible through GoDaddy alone.
- [ ] **Firebase project ID**: `.firebaserc` and the workflow use `crossmaze-website`. If the console shows a different ID, update both.

## Credits

- **Owl illustration** on the “page not found” page (`src/assets/brand/owl.svg`): “Owl” by anarres, from Openclipart (https://openclipart.org/detail/328460/owl), dedicated to the public domain under CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/), so no credit is needed on the site. Only editor metadata was removed and a viewBox added.
