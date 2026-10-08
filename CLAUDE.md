# Crossmaze website

See README.md for how the site, admin panel and LITMUS integration fit together.

## Design rules (from the school)

- **Every background is a gradient, never a flat colour:** page, banners, header, footer, cards, buttons, badges, panels and form boxes. Use the `--g-*` tokens in `src/styles/global.css`, or a two-stop tint (`--badge-bg` → `--badge-bg-2`) for toned items.
- **No hard colour changes between sections.** The page background is one pastel gradient that flows down the whole page (`--g-flow` on `body`, plus soft glows in `body::before`). Sections, banners and the footer have no full-width background of their own. Set a call-out apart with a floating panel (`section--feature`) or frosted-glass cards, never a coloured band with straight edges.
- Surfaces are frosted glass (`--g-card`, `--g-glass`, `--g-soft`) with soft violet-tinted shadows (`--shadow-sm`, `--shadow`, `--shadow-lift`). Page headings use `--g-heading`; photos get a gradient ring (`--g-ring`).
- Decorations are preschool doodles (crayons, ABC blocks, kites, rainbows…) from `src/components/doodles.ts`. They must not cover text: check banners at 1366, 900 and 390px wide.
- Anything that moves must stop for `prefers-reduced-motion`.

## Content

- Live content is edited in the admin panel (Firestore). `content/*.json` is only the starting copy that each deploy overwrites from Firestore.
- A new editable field needs: the JSON in `content/`, its type in `src/data/content.ts`, its form field in `src/admin/schemas.ts` and, for `sections`, its key in `normalize.sections` in `scripts/sync-content.mjs`. Deploys from `main` copy new fields into Firestore.
- Don't invent facts about the school (fees, timings, staff, results). Add anything that needs checking to "Please verify before launch" in README.md.

## Checks

`npm run build` (type-check and build) and `npm test` (functions). Rules tests need the emulators: `npm run test:rules`.
