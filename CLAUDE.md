# Crossmaze website

See README.md for how the site, admin panel and LITMUS integration fit together.

## Design rules (from the school)

- **Only the page background is a gradient; boxes are white liquid glass** (like Apple's): translucent white (`--glass`, or `--glass-thick` over photos and busy content) with `backdrop-filter: var(--glass-blur)`, a `1px solid var(--glass-edge)` border and `var(--glass-rim)` in the box shadow. This covers cards, panels (`section--feature`), the floating header bar and its menus, the footer, form fields, pop-ups and labels over photos, in every theme. Accents keep their gradients: buttons, icon badges (`--badge-bg` → `--badge-bg-2`) and heading text.
- **No hard colour changes between sections.** The page background is one pastel gradient that flows down the whole page (`--g-flow` on `body`, plus soft glows in `body::before`). Sections, banners and the footer have no full-width background of their own. Set a call-out apart with a floating glass panel (`section--feature`) or glass cards, never a coloured band with straight edges.
- **Keep it calm.** Glass boxes stand out with soft tinted shadows (`--shadow-sm`, `--shadow`, `--shadow-lift`); photos sit in a thin glass frame (`--g-ring`); section labels (`.eyebrow`) are plain coloured text, not boxes. Page headings use `--g-heading`.
- Decorations are preschool doodles (crayons, ABC blocks, kites, rainbows…) from `src/components/doodles.ts`, used sparingly: a few in each banner and one per section, in the page margin (left out where the margin is too narrow). They must not cover text: check banners at 1366, 900 and 390px wide.
- Anything that moves must stop for `prefers-reduced-motion`.
- **Seven colour themes** rotate on the live site (admin: Site settings → Look and feel). Style with the tokens in `src/styles/global.css` (never a colour value where a theme should show), and give a new token a value in each theme in `src/styles/themes.css`. Check changes in every theme with `?theme=pastel|meadow|ocean|crayon|calm|candy|tropical`.

## Content

- Live content is edited in the admin panel (Firestore). `content/*.json` is only the starting copy that each deploy overwrites from Firestore.
- A new editable field needs: the JSON in `content/`, its type in `src/data/content.ts`, its form field in `src/admin/schemas.ts` and, for `sections`, its key in `normalize.sections` in `scripts/sync-content.mjs`. Deploys from `main` copy new fields into Firestore.
- To change existing copy (text, phone numbers, addresses), edit `content/*.json` and run `node scripts/content-update.mjs <id> "<what changed>"` before committing. Without a content update in `content/updates/`, the next deploy overwrites the edit with Firestore's copy.
- Blog posts (`content/posts.json`, admin → Blog) pick one of six designs: `src/components/blog/Template*.astro`, listed in `src/data/blogOptions.ts`. A new design needs a component, an entry there, a case in `PostPage.astro` and a sketch in the admin's `TemplateSketch` (`src/admin/components/fields.tsx`). Hidden posts are drafts, built only at `/blog/preview/<previewKey>`.
- Branch admins (`branchAdmins/{email}`) may only write their own blog posts (`createdBy`), change `centerHead` on their branches and publish. Anything new they should reach needs a rule in `firestore.rules`/`storage.rules`, a test in `tests/rules.test.mjs` and `roles` on its `NAV` entry in `src/admin/AdminApp.tsx`.
- Don't invent facts about the school (fees, timings, staff, results). Add anything that needs checking to "Please verify before launch" in README.md.

## Checks

`npm run build` (type-check and build) and `npm test` (functions). Rules tests need the emulators: `npm run test:rules`.
