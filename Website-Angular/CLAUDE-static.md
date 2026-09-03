# Béute Pro — Verdant

Static HTML/CSS/vanilla JS storefront. No build step, no package.json, deployed to Vercel.
Deep green / gold / ivory theme. Hero is a JS slider (no video — `assets/video/` is unused).

## File map

- `index.html` / `shop.html` / `product.html` — the three pages. Each defines
  `PAGE_INIT()` and `PAGE_LANG()` inline; `main.js` calls them after boot and
  on language change.
- `assets/js/i18n.js` — the `T` string table (en/ar). Load first.
- `assets/js/products.js` — `PRODUCTS`, `CATEGORIES`, `CURRENCY`. The only file
  meant to be edited to add/change products.
- `assets/js/main.js` — core: `$`/`$$` helpers, `store` (localStorage wrapper),
  language apply, `Audio_` (background music), `Cart`, product card rendering
  (`cardHTML`, `renderGrid`), image guard/fallback, nav/menu, boot sequence.
- `assets/js/slider.js` — hero slider on `index.html` only (autoplay, drag,
  arrows, dots, keyboard).
- `assets/js/product.js` — product page only: zoom/magnifier, touch zoom, the
  360°/spin viewer, buy box controls, accordion.
- `assets/js/motion.js` — scroll reveals, word-split headlines, counters,
  parallax, magnetic buttons, header show/hide, progress bar. Load last.
- `assets/css/style.css` — all styles, one file.

Script load order matters: `i18n.js` → `products.js` → `main.js` → (page
script) → `motion.js`. `product.html` also loads `product.js` after `main.js`.

## products.js shape

Each entry in `PRODUCTS`:

```js
{
  id: "almond-oil",       // required, unique, lowercase-with-dashes — drives image paths
  category: "cold-pressed-oils", // required, must match a CATEGORIES id
  price: 3000,             // required, plain number
  oldPrice: null,          // number to show strike-through sale price, else null
  badge: "bestseller",     // "bestseller" | "new" | "sale" | null
  images: 3,                // required, how many product photos exist
  spin: false,              // required, true = show 360° tab (needs 8+ frames)
  size: "120 ml (4.06 OZ)", // required, display string
  en: { name, tagline, description, ingredients[], benefits[], usage },
  ar: { name, tagline, description, ingredients[], benefits[], usage }
}
```

`en` and `ar` are both required, same shape. `L(p)` in main.js picks the
active-language block at render time.

## Image naming rule

`id` maps directly to filenames: id `"almond-oil"` → `assets/img/products/
almond-oil-1.png`, `-2.png`, `-3.png` (count = `images`). `imgSrc(id, n)` in
main.js builds this path. Category tiles: `assets/img/categories/<id>.jpg`.

## Spin (360°) rule

`spin: true` requires 8+ real frames in `assets/img/spin/<id>/frame-01.png`
… sequential, zero-padded, no gaps. `Spin.probe()` in product.js walks
frame-01 up to frame-36 and stops at the first missing one — a stray or
misnamed file anywhere in the sequence truncates it. Fewer than 8 frames
found falls back to "tilt" mode (single photo, 3D tilt on hover/drag).

## i18n

Every visible string is keyed in `T.en{}` and `T.ar{}` in `i18n.js`. In HTML,
`data-i18n="key"` sets `textContent`, `data-i18n-ph="key"` sets `placeholder`,
`data-i18n-aria="key"` sets `aria-label`. `applyLang()` in main.js walks all
three attributes on every language change. **Any new UI string needs both an
`en` and an `ar` entry** — `t(key)` falls back to `T.en[key]` then to the raw
key if a translation is missing, so a silent gap is easy to miss.

## CSS token system

All colour, spacing, radius, shadow and easing values are custom properties
on `:root` in `style.css` (`--green`, `--gold`, `--ivory`, `--gut`, `--r`,
`--shadow`, `--ease`, etc). **New CSS must use these variables — never a
hardcoded hex value or raw px/rem where a token exists.** See the `:root`
block at the top of `style.css` for the full list.

## Motion

`motion.js` builds one shared `IntersectionObserver` (`Motion.io`) that drives
reveal animation. A new animated element just needs a class:
- `.reveal` — fades/slides up once, in view.
- `.stagger` — same, applied to a container; each child gets a staggered delay.
- `.split` (or `data-split` attribute) — word-by-word headline reveal.

No new JS wiring needed — `Motion.observe()` picks up any matching class in
the DOM. After re-rendering a dynamic container (e.g. a product grid), call
`Motion.reset(box)` to re-arm it.

## Conventions to respect

- `prefers-reduced-motion: reduce` is handled in three places: three
  `@media(prefers-reduced-motion:reduce)` blocks in `style.css`, plus
  `Motion.reduced` / `reduced` checks in `motion.js`, `slider.js` and
  `product.js` that skip JS-driven animation. Any new animation needs both
  the CSS media query treatment and a JS guard if it's driven by JS.
- All `localStorage` access is wrapped in `try/catch` (see `store` in
  main.js) — Safari private mode and similar can throw on access.
- Images that may not exist yet use `data-fallback` + `guard(img)` /
  `guardAll(scope)` in main.js: on error it steps `.png` → `.jpg` → `.jpeg` →
  an inline SVG placeholder, in that order, by rewriting the `src` extension.

## Do not touch

- `assets/audio/` — binary, do not read or edit.
- `assets/img/` — binary, do not read or edit (use `ls`/Glob for filenames only).
- The `:root` token block in `style.css` — add new tokens if needed, don't
  change existing values without being asked.
