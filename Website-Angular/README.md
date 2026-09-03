# Béute Pro — Verdant (Angular)

Angular 20 storefront for Béute Pro. Standalone components, signals, the
built-in control flow, and server-side rendering with build-time prerendering
of every route.

Ported from the static site in `../Website`, which is kept as the visual
reference until this port is signed off. `CLAUDE-static.md` is that site's
old guide; `CLAUDE.md` is the one for this app.

## Commands

```bash
npm install
npm start                    # dev server → http://localhost:4200
npm run build                # browser + server bundles; prerenders 29 routes
npm run serve:ssr:beute-pro  # the built SSR server → http://localhost:4000
```

## Routes

| Path | Page |
|---|---|
| `/` | home |
| `/shop` | the full range |
| `/shop/:category` | filtered by category |
| `/product/:id` | product detail |
| `/about` `/contact` `/faq` `/policies` | content pages |

`/shop` also accepts `?group=skincare|haircare` and `?concern=…` from the
Shop mega menu.

## Where things live

- **Content you'll want to edit** — `src/app/core/data/products.ts` (products,
  categories, currency) and `src/app/core/data/i18n.data.ts` (the EN/AR
  strings). Both are typed; a missing Arabic key is a compile error.
- **Styling** — all of it is global, in `src/styles.scss`. Component `.scss`
  files are deliberately empty.
- **Media** — `public/assets/`, served from `/assets/…`.

`CLAUDE.md` has the full map, the conventions to keep, and the two known
issues carried over from the static site.

## Deployment

`npm run build` emits `dist/beute-pro/` with a `browser/` folder (fully
prerendered HTML for every route) and a `server/` folder (the Node SSR
server, for anything rendered on demand).

Add the production hostname to `security.allowedHosts` in `angular.json`
before deploying — the SSR server rejects Host headers it does not recognise
and falls back to client-side rendering.
