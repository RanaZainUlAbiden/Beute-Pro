# Béute Pro — Verdant (Angular)

Angular 20 storefront, standalone components, signals, built-in control
flow, SSR + prerender via `@angular/ssr`. Deep green / gold / ivory theme.
Ported from the static site in `../Website`, which stays as the visual
reference until this port is signed off (`CLAUDE-static.md` is its old
guide).

```
npm start                    # dev server, http://localhost:4200
npm run build                # browser + server bundles, prerenders 29 routes
npm run serve:ssr:beute-pro  # the built SSR server, http://localhost:4000
```

## Directory map

```
src/
  index.html                 shell: fonts, favicon, <base>, the noscript rule
  styles.scss                ALL styling (see "Styles")
  app/
    app.ts/.html             the shell: header, outlet, footer, drawers, <audio>
    app.routes.ts            routes + per-page title/description/body flags
    app.routes.server.ts     prerender config, params from the catalogue
    core/
      image.ts               imgSrc / catSrc / spinSrc / PLACEHOLDER
      data/products.ts       PRODUCTS, CATEGORIES, CURRENCY — typed
      data/i18n.data.ts      the EN/AR string tables
      models/                Product, Category, Currency, Lang
      services/              i18n, cart, audio, motion, scroll, toast,
                             layout, storage
      directives/            img-fallback, reveal, stagger, accordion-panel,
                             count-up, parallax, magnetic
    shared/                  header, footer, cart-drawer, toast,
                             whatsapp-button, product-card, progress-bar,
                             back-to-top, split-heading
    features/                home, shop, product, about, contact, faq, policies
public/assets/               img, video, audio — copied from the static site
```

Every component lives in its own folder with `.ts`, `.html` and `.scss`.
No inline templates, no inline styles.

## Routes

| Path | Page | Body |
|---|---|---|
| `/` | home | hero under the header |
| `/shop` | shop, everything | |
| `/shop/:category` | shop, filtered | |
| `/product/:id` | product detail | `no-hero` |
| `/about` `/contact` `/faq` `/policies` | | `no-hero` |

`?group=skincare|haircare` and `?concern=…` still arrive on `/shop` from the
mega menu. `group` maps to several categories (`SHOP_GROUPS` in
`features/shop/shop.ts`); `concern` is accepted and ignored — there is no
concern data on products yet.

Every route is prerendered at build time, including one file per product and
per category. `getPrerenderParams` in `app.routes.server.ts` reads them from
`PRODUCTS`/`CATEGORIES`, so a new product needs no route change.

## products.ts shape

`core/data/products.ts` is the only file you need to edit to add or change a
product. `core/models/product.ts` has the interfaces; the important fields:

```ts
{
  id: "almond-oil",              // unique, lowercase-with-dashes — drives image paths
  category: "cold-pressed-oils", // must match a CATEGORIES id
  price: 3000,                   // plain number, no symbol or commas
  oldPrice: null,                // a number shows a strike-through sale price
  badge: "bestseller",           // "bestseller" | "new" | "sale" | null
  images: 3,                     // how many product photos exist
  spin: false,                   // a 360° video exists for this product
  size: "120 ml (4.06 OZ)",
  en: { name, tagline, description, ingredients[], benefits[], usage },
  ar: { … }                      // same shape, required
}
```

`I18nService.copy(p)` picks the active-language block at render time.

## Image and video paths

Paths are **root-absolute** (`/assets/…`), not relative — a routed URL like
`/product/almond-oil` would otherwise resolve a relative path against
`/product/`. That is the only change made to them.

- product photo: `imgSrc(id, n)` → `/assets/img/products/<id>-<n>.png`
- category tile: `catSrc(id)` → `/assets/img/categories/<id>.jpg`
- 360° clip: `spinSrc(id)` → `/assets/video/spin/<id>.mp4`

> **Known mismatch, carried over from the static site.** `imgSrc` builds a
> flat path, but the photos on disk are nested one folder deeper
> (`/assets/img/products/almond-oil/almond-oil-1.png`). Every product image
> therefore 404s and falls through to the PHOTO PENDING placeholder — on the
> static site too. One line in `core/image.ts` fixes it:
> `` `/assets/img/products/${id}/${id}-${n}.png` ``. Left as it is so the two
> builds render identically; change it when you are ready to change both.

Images that may not exist yet carry `data-fallback`; `ImgFallbackDirective`
walks `.png` → `.jpg` → `.jpeg` → an inline SVG placeholder on error, adding
`.is-placeholder` at the end. Unlike the old `guard()`, it re-arms by itself
whenever `[src]` is re-bound.

## The 360° viewer

A product shows the "360° view" tab only once
`/assets/video/spin/<id>.mp4` has been confirmed to load — `preload="metadata"`
doubles as the existence probe, so only the header is fetched until the
visitor opens the tab. Drag scrubs the timeline (RTL-aware), arrow keys step
1/24 of it, and the clip pauses off screen. Under reduced motion it never
autoplays: the poster frame is all you get.

The homepage has the same viewer as a "spotlight" section, scrubbed by scroll
position instead of hover. It picks the first product in `PRODUCTS` order with
a working video and renders nothing at all if none has one.

## i18n

`core/data/i18n.data.ts` holds the EN/AR tables, verbatim from the static
site. `ar` is typed as `Record<keyof typeof en, string>`, so **a key added on
one side and forgotten on the other is a compile error**, not a silent English
fallback.

Templates call `i18n.t('nav.home')`. `TranslationKey` is derived from the `en`
table, so a mistyped key fails the build. `I18nService.lang` is a signal;
changing it re-renders every string and flips `lang`/`dir` on
`<html>` — there is no DOM walk over `data-i18n` attributes any more.

Also on the service: `copy(product)`, `catName(category)`, `money(n)`,
`isRTL()`, `toggleLabel()`.

## Styles

`src/styles.scss` is the static site's `style.css`, unchanged — the `:root`
token block, the resets and every shared class stay **global**. Component
`.scss` files are empty by design; add to one only when a rule is genuinely
local to that component.

**New CSS must use the `:root` custom properties — never a hardcoded hex or a
raw px/rem where a token exists.** Don't restructure the token block or rename
a variable.

The one addition is a short shim at the top of the file: component host
elements (`app-header`, `app-product-card`, …) get `display:contents` so they
generate no box and the layout tree matches the static site's exactly. Add
any new component's selector to that list.

`preserveWhitespaces: true` is set in `tsconfig.json`. Angular otherwise
deletes whitespace-only text nodes between elements, which would close the gap
between two inline spans (a two-part `<h1>`, for one). Write template
whitespace as you mean it to render.

## Motion

`MotionService` owns **one** shared `IntersectionObserver` for the whole app —
not one per element. A new animated element just needs a class:

- `.reveal` — fades/slides up once, in view (`RevealDirective`)
- `.stagger` — same, on a container; each child gets a staggered delay
  (`StaggerDirective`). Bind `[staggerKey]` to something that changes when the
  contents do, and the row re-arms and plays again — that is what
  `Motion.reset()` used to do.
- `splitHeading` — word-by-word headline reveal (`shared/split-heading`).
  Takes `[text]` for a bare heading or `[segments]` for one built from several
  spans. The words are part of the template, so a language change re-renders
  them and the server sends real words for search engines. The `.split` class
  is added only after the first browser render, exactly as `motion.js` did.

`CountUpDirective`, `ParallaxDirective` and `MagneticDirective` are ported but
have no consumer in the current markup — the homepage's three figures were
made static in the redesign. They are kept so `[data-count]`,
`[data-parallax]` and `[data-magnetic]` still work if the markup ever uses
them again.

## Conventions to respect

- **Reduced motion** is handled in two places, and a new animation needs
  both: the three `@media(prefers-reduced-motion:reduce)` blocks in
  `styles.scss`, and a `MotionService.reduced` check wherever JS drives the
  animation (hero video, spotlight scrub, spin autoplay, split, reveal).
- **All `localStorage` goes through `StorageService`** — every read and write
  is in a try/catch with an in-memory fallback, because Safari private mode
  and similar throw on access. Never touch `localStorage` directly; it does
  not exist on the server.
- **Browser-only code** goes in `afterNextRender` or behind
  `isPlatformBrowser`. `window`, `document`, `matchMedia`, `IntersectionObserver`
  and `localStorage` all break the SSR build otherwise.
- **The cart is session-only.** `CartService` holds signals in memory; there
  is no backend and nothing is persisted, so a reload empties it.
- **The audio gesture-unlock in `AudioService` is load-bearing.** Browsers
  block sound that starts on its own, so it tries immediately and, if refused,
  arms one-shot capture listeners on six events and starts on the visitor's
  first move. Don't simplify it.
- RTL is full, including the mirrored hero scrim and the mirrored drag/scrub
  direction. Test both directions.
- Responsive down to 360px, with no horizontal overflow.

## Do not touch

- `public/assets/audio/`, `public/assets/img/`, `public/assets/video/` —
  binary. Use `ls`/Glob for filenames only.
- The `:root` token block in `styles.scss` — add tokens if you need them,
  don't change existing values without being asked.
- `../Website/` — the static reference. It stays until the port is confirmed.
