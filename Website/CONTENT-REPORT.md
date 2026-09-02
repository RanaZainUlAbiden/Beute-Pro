# Content Report — products.js live-copy replacement

Source: https://beutepro.com (public, noindex/nofollow, no login used).
Raw extracted data saved per-product to `content/<id>.json` for reference.

## Products added/updated

18 products total, all fetched successfully from the live site.

### Existing 8 (copy replaced with live-site text)
- `aloe-vera-mist` — copy refreshed; `spin` changed from `true` to `false`
  (the `assets/img/spin/aloe-vera-mist/` folder is empty — only a
  `_README.txt` — so no real frames exist).
- `cucumber-mist`, `neem-mist` — copy refreshed with live ingredients/benefits/usage.
- `almond-oil`, `apricot-oil` — copy refreshed; ingredients kept as the
  single-ingredient line (matches the product itself, not invented).
- `kalonji-oil` — id kept, `en.name` changed to the live site's name
  **"Black Seed Oil"**. Dropped the old `oldPrice: 3500` / `badge: "sale"` —
  the live site shows no sale price, so keeping a fabricated old price would
  misrepresent an active discount that doesn't exist.
- `herbal-hair-oil` — **the live product page has no description, benefits,
  or usage text at all**, only a "17 Herbs" mention (verified with two fetch
  passes). The previous placeholder copy invented specific herb names
  (Amla, Bhringraj, Fenugreek, Hibiscus, Coconut Oil) that are not stated
  anywhere on the live site — these were dropped, not carried forward.
  `benefits` is now an empty array rather than invented claims. This is the
  weakest entry in the file and needs real copy from the client.
- `honey-oats-soap` — copy refreshed to match live wording.

### New 10 products (not previously in products.js)
- `sesame-seed-oil`, `amla-hair-oil` — full copy from live site, single-ingredient
  oils.
- `lemon-mint-mist`, `rose-water-mist`, `botanical-essence-mist` — full copy
  including ingredient lists (all three mist ingredient lists are real,
  taken verbatim from their product pages).
- `almond-rose-soap` (live name "Rose & Almond Soap"), `aloe-vera-cucumber-soap`,
  `charcoal-tea-tree-soap` (live name "Charcoal Soap" — the "tea tree" in the
  id is per your instruction, not from the product's own copy), 
  `goat-milk-tea-tree-soap`, `turmeric-neem-soap` — description/benefits from
  live site; **no soap has a published ingredients list**, and none had usage
  instructions.

### Images / spin
No image files were touched. Confirmed via `ls` (not opened) that all 18
`assets/img/products/<id>-1.jpg` files already exist and match the ids used
here. `images: 1` for every product. `spin: true` only for `herbal-hair-oil`
(10 real frames present in `assets/img/spin/herbal-hair-oil/`).

### Size
The live site does not display size/volume anywhere on any product page
(`size` came back "NOT FOUND" for all 18 in the raw fetch). Kept the
pre-existing convention from the old file — 120 ml for oils/hair oils/mists,
100 g for soaps — since these are physical packaging facts, not marketing
claims, and no other source is available. **Flag for the client:** please
confirm actual net weights/volumes for the new products.

## Products with missing ingredients, usage, or description on the live site

- **Ingredients not published:** all 6 soaps, and all 5 single-ingredient
  oils/hair-oils use the product name itself as the sole ingredient (e.g.
  "100% Cold Pressed Sweet Almond Oil") rather than a real INCI list — this
  mirrors what the old file already did for 3 products, not a new invention.
  Soap ingredients were left as `[]` since a soap is a multi-ingredient
  formulation and no real ingredient breakdown exists to report.
- **Usage not published:** all 6 soaps except `honey-oats-soap` (which has
  "For external use only."). A generic, non-specific instruction ("wet the
  bar, lather, rinse") was used for the rest — this is universal to any bar
  soap and makes no product-specific claim.
- **`herbal-hair-oil`:** no description, benefits, or usage published at all
  (see above). This is the one product that most needs client-supplied copy.
- **`turmeric-neem-soap`:** no description paragraph on the live page (only
  a title fragment "For Skin. Turmeric & Neem Soap. Unisex / Handcrafted").
  Its benefits list is a verbatim duplicate of the Charcoal Soap page on the
  live site — reused here since that's genuinely what the client's own site
  shows, not a scraping error (confirmed with two fetch passes).

## Decisions made on ambiguity

1. **`kalonji-oil` id/name split** — followed your explicit instruction: id
   stays `kalonji-oil`, `en.name` is the live site's "Black Seed Oil".
2. **`charcoal-tea-tree-soap` id** — followed your explicit instruction; the
   live product itself is just called "Charcoal Soap" with no tea tree
   mentioned in its own copy (tea tree only appears on the separate Goat
   Milk & Tea Tree Soap page). Used the plain live name for `en.name`.
3. **Category placement for oils listed under two live categories** —
   `almond-oil`, `apricot-oil`, `kalonji-oil`, `sesame-seed-oil` appear under
   both "Cold Pressed Oils" and "Hair Oils" on the live site. Kept them in
   `cold-pressed-oils` to match the existing file's convention (they were
   already there for the 3 pre-existing entries).
4. **Kalonji oral-use health claim** — the live site's own usage text says
   "Take ½ tsp daily... to boost immunity." Kept verbatim per the no-invention
   rule (it's the client's own claim, not mine), but flagging it here since
   oral-consumption / immunity claims on a cosmetics site may need legal
   review.
5. **Badges** (`bestseller` / `new` / `sale`) — not present on the live
   site's markup in any reliable, extractable form. Kept the previous
   file's badges for the 8 pre-existing products (except dropped `sale` on
   kalonji-oil, see above) and assigned `new` to a few of the 10 newly-added
   products as a neutral default; these are merchandising choices for you
   to revise as you see fit, not scraped facts.
6. **No new categories added.** All 18 products fit the existing 5 categories
   (`mists`, `soaps`, `cold-pressed-oils`, `hair-oils`); `serums` remains
   defined with zero products, matching the live site (its category page is
   confirmed empty).

## Verification

`node --check assets/js/products.js` passes.
