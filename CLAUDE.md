# Crossmaze website

See README.md for how the site, admin panel and LITMUS integration fit together.

## Design rules (from the school)

- **Only the page background is a gradient; boxes are plain white.** Cards, panels (`section--feature`), the header bar, the footer, form fields, labels (`.eyebrow`) and pop-ups use white (`--g-card`, `--g-glass`, `--g-soft` and `--g-panel` are all `#ffffff`), in every theme. Accents keep their gradients: buttons, icon badges (`--badge-bg` → `--badge-bg-2`), photo rings and heading text.
- **No hard colour changes between sections.** The page background is one pastel gradient that flows down the whole page (`--g-flow` on `body`, plus soft glows in `body::before`). Sections, banners and the footer have no full-width background of their own. Set a call-out apart with a floating white panel (`section--feature`) or white cards, never a coloured band with straight edges.
- White boxes stand out from the page with soft tinted shadows (`--shadow-sm`, `--shadow`, `--shadow-lift`). Page headings use `--g-heading`; photos get a gradient ring (`--g-ring`).
- Decorations are preschool doodles (crayons, ABC blocks, kites, rainbows…) from `src/components/doodles.ts`. They must not cover text: check banners at 1366, 900 and 390px wide.
- Anything that moves must stop for `prefers-reduced-motion`.
- **Seven colour themes** rotate on the live site (admin: Site settings → Look and feel). Style with the tokens in `src/styles/global.css` (never a colour value where a theme should show), and give a new token a value in each theme in `src/styles/themes.css`. Check changes in every theme with `?theme=pastel|meadow|ocean|crayon|calm|candy|tropical`.

## Content

- Live content is edited in the admin panel (Firestore). `content/*.json` is only the starting copy that each deploy overwrites from Firestore.
- A new editable field needs: the JSON in `content/`, its type in `src/data/content.ts`, its form field in `src/admin/schemas.ts` and, for `sections`, its key in `normalize.sections` in `scripts/sync-content.mjs`. Deploys from `main` copy new fields into Firestore.
- To change existing copy (text, phone numbers, addresses), edit `content/*.json` and run `node scripts/content-update.mjs <id> "<what changed>"` before committing. Without a content update in `content/updates/`, the next deploy overwrites the edit with Firestore's copy.
- Don't invent facts about the school (fees, timings, staff, results). Add anything that needs checking to "Please verify before launch" in README.md.

## Checks

`npm run build` (type-check and build) and `npm test` (functions). Rules tests need the emulators: `npm run test:rules`.
