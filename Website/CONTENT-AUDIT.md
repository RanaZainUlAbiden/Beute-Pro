# Content Audit — beutepro.com vs products.js

Live site: 18 products across 4 populated categories (`shop/` pages 1–2,
plus each category page). `serums` category exists in `CATEGORIES` but has
zero live products ("No products were found matching your selection") —
no action needed there.

One oddity: the live **Hair Oils** category page lists Almond Oil, Apricot
Oil, Black Seed Oil and Sesame Seed Oil alongside the real hair oils (Herbal
Hair Oil, Amla Hair Oil) — those four are also each on their own
**Cold Pressed Oils** category page. Our schema allows only one `category`
per product. Below I've kept the 3 that already exist in products.js as
`cold-pressed-oils` (their current assignment) and put new Sesame Seed Oil
there too, since that's their dedicated category page. Flagging this for you
in case you'd rather they show in both listings on the live site.

## Mists (live category: 6 products, all ₨800)

| Live name | Price | URL | products.js entry? | Image (per ASSET-MAP.md) |
|---|---|---|---|---|
| Face Mist Aloe Vera | 800 | /product/face-mist-aloe-vera/ | yes — `aloe-vera-mist` | `Face Mist (Aloevera).jpeg` |
| Face Mist Cucumber | 800 | /product/face-mist-cucumber/ | yes — `cucumber-mist` | `Face Mist (Cucumber).jpeg` |
| Face Mist Neem | 800 | /product/face-mist-neem/ | yes — `neem-mist` | `Face Mist (Neem).jpeg` |
| Face Mist Botanical Essence | 800 | /product/face-mist-botanical-essence/ | **no** — new, proposed id `botanical-essence-mist` | `Face Mist (Botanical Essence).jpeg` |
| Face Mist Lemon & Mint | 800 | /product/face-mint-lemon-mint/ | **no** — new, proposed id `lemon-mint-mist` | `Face Mist(Lemon and Mint).jpeg` |
| Face Mist Rose Water | 800 | /product/face-mist-rose-water/ | **no** — new, proposed id `rose-water-mist` | `Face Mist(Rose Water).jpeg` |

## Soaps (live category: 6 products, all ₨1,500)

| Live name | Price | URL | products.js entry? | Image (per ASSET-MAP.md) |
|---|---|---|---|---|
| Honey & Oats Soap | 1500 | /product/honey-oats-soap/ | yes — `honey-oats-soap` | `Honey and Oats Handcrafted  Soap.jpeg` |
| Aloe Vera & Cucumber Soap | 1500 | /product/aloe-vera-cucumber-soap/ | **no** — new, proposed id `aloe-vera-cucumber-soap` | `Aloevera and Cucumber Handcrafted  Soap.jpeg` |
| Rose & Almond Soap | 1500 | /product/rose-almond-soap/ | **no** — new, proposed id `almond-rose-soap` | `Almond and Rose Handcrafted  Soap.jpeg` |
| Goat Milk & Tea Tree Soap | 1500 | /product/goat-milk-tea-tree-soap/ | **no** — new, proposed id `goat-milk-tea-tree-soap` | `Goat Milk And Tea Tree Handcrafted  Soap.jpeg` |
| Turmeric & Neem Soap | 1500 | /product/turmeric-neem-soap/ | **no** — new, proposed id `turmeric-neem-soap` | `Turmeric And Neem Handcrafted  Soap.jpeg` |
| Charcoal Soap | 1500 | /product/charcoal-soap-2/ | **no** — flagged, see below | `Charcoal And Tea Tree Handcrafted  Soap.jpeg` |

**Flag — Charcoal Soap id:** live product is named plainly "Charcoal Soap,"
but the only matching image is `Charcoal And Tea Tree Handcrafted Soap.jpeg`
(a previous, deleted asset set had a separate `charcoal-soap-1.png` with no
"tea tree" in the name). I need your call before Step 3: use id
`charcoal-soap` (matches the live product name) or `charcoal-tea-tree-soap`
(matches the current image filename)? I'll pull the live page's own
ingredient list in Step 2 either way to confirm whether tea tree is actually
in the formula.

## Cold Pressed Oils (live category: 4 products, all ₨3,000)

| Live name | Price | URL | products.js entry? | Image (per ASSET-MAP.md) |
|---|---|---|---|---|
| Almond Oil | 3000 | /product/almond-oil/ | yes — `almond-oil` | `Almond Oil.jpeg` |
| Apricot Oil | 3000 | /product/apricot-oil/ | yes — `apricot-oil` | `Apricot Oil.jpeg` |
| Black Seed Oil | 3000 | /product/black-seed-oil/ | yes — **kept as existing id `kalonji-oil`** (live renamed it "Black Seed Oil"; instructions say keep the existing id since ASSET-MAP maps this image to it) | `Kalonji Oil.jpeg` |
| Sesame Seed Oil | 3000 | /product/sesame-seed-oil/ | **no** — new, proposed id `sesame-seed-oil` | `Sesame Seed Oil.jpeg` |

## Hair Oils (live category page also cross-lists the 4 oils above; real hair oils are:)

| Live name | Price | URL | products.js entry? | Image (per ASSET-MAP.md) |
|---|---|---|---|---|
| Herbal Hair Oil | 3000 | /product/herbal-hair-oil/ | yes — `herbal-hair-oil` (spin:true, 10 real frames confirmed on disk) | `Herbal Hair Oil.jpeg` |
| Amla Hair Oil | 3000 | /product/amla-hair-oil/ | **no** — new, proposed id `amla-hair-oil` | `Amla Hair Oil.jpeg` |

## Serums

No live products. `serums` category stays in `CATEGORIES` with zero entries.

## Summary

- **18 live products = 18 images on disk.** Every image maps to exactly one
  live product; every live product has exactly one image. No orphans either
  direction.
- **8 existing products.js entries** all match a live product — none are
  dead/orphaned. `kalonji-oil` keeps its id despite the live rename to
  "Black Seed Oil."
- **10 new products** need entries: `aloe-vera-cucumber-soap`,
  `almond-rose-soap`, `goat-milk-tea-tree-soap`, `turmeric-neem-soap`,
  `charcoal-soap` or `charcoal-tea-tree-soap` (**needs your call**),
  `botanical-essence-mist`, `lemon-mint-mist`, `rose-water-mist`,
  `sesame-seed-oil`, `amla-hair-oil`.
- **`images` count:** every product currently has exactly **1** real photo
  on disk (Title Case, no `-1`/`-2`/`-3` suffix, `.jpeg` not `.png` —
  see ASSET-MAP.md). Per CLAUDE.md, `images` must reflect the real file
  count, so every entry will need `images: 1` until more photos exist. This
  also means every image will need the ASSET-MAP.md rename to
  `<id>-1.jpeg` for `imgSrc()` to ever find it — that's a file rename, not a
  products.js change, so I'll leave it out of Step 3 unless you want me to
  do the renames too (they're plain filesystem moves, not reads of image
  content, so no CLAUDE.md conflict).
- **`spin`:** only `herbal-hair-oil` has real frames (10, confirmed on
  disk). `aloe-vera-mist`'s spin folder contains only a `_README.txt` — no
  frames — so its entry will be corrected to `spin: false` as instructed.
- **Category note:** the live "Hair Oils" page cross-lists all 4 cold-pressed
  oils; I'm keeping those 4 under `cold-pressed-oils` only (see oddity note
  at top) unless you tell me otherwise.

Waiting for your go-ahead (and the Charcoal Soap id call) before Step 2.
