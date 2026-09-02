# Asset Inventory — `assets/img/products/`

Generated as part of an asset-inventory pass. No files were renamed by this
document — renames below are proposals only.

## Context

- `imgSrc(id, n)` in `assets/js/main.js` builds paths as
  `assets/img/products/<id>-<n>.png` (e.g. `almond-oil-1.png`).
- `guard()`'s error fallback only swaps the **extension** on that same
  filename (`.png` → `.jpg` → `.jpeg` → inline placeholder). It does **not**
  search for a differently-named file.
- Conclusion: a file must be named exactly `<id>-<n>.<ext>` (ext one of
  png/jpg/jpeg) to ever be picked up by the site. **None of the 18 files
  currently in `assets/img/products/` follow this pattern** — they're
  single, human-titled files with no `-1`/`-2`/`-3` suffix. Until renamed,
  every product card and product page on the live site falls through to the
  inline SVG placeholder.
- The folder-case issue (`Products/` vs `products/`) was found and fixed
  earlier in this session (plain filesystem rename — the capitalized folder
  was untracked, so `git mv` did not apply). All 18 files below now live
  under lowercase `assets/img/products/`.
- The original tracked PNG set (`almond-oil-1.png`, `amla-hair-oil-1.png`,
  `charcoal-soap-1.png`, etc. — 10 files) is gone from the working tree
  (`git status` shows them as deleted). They are **not** on disk anymore, so
  they're omitted from the table below; see "products.js entries with no
  image file" for how this affects each product.

## Inventory table

| actual filename | ext | best-guess product id | in products.js? | matches what imgSrc() would load? |
|---|---|---|---|---|
| `Almond Oil.jpeg` | .jpeg | `almond-oil` | yes (`almond-oil`, cold-pressed-oils) | no |
| `Almond and Rose Handcrafted  Soap.jpeg` | .jpeg | UNSURE — `almond-rose-soap` | no | no |
| `Aloevera and Cucumber Handcrafted  Soap.jpeg` | .jpeg | UNSURE — `aloe-vera-cucumber-soap` | no | no |
| `Amla Hair Oil.jpeg` | .jpeg | `amla-hair-oil` | no | no |
| `Apricot Oil.jpeg` | .jpeg | `apricot-oil` | yes (`apricot-oil`, cold-pressed-oils) | no |
| `Charcoal And Tea Tree Handcrafted  Soap.jpeg` | .jpeg | UNSURE — `charcoal-tea-tree-soap` (old asset set had a plain `charcoal-soap`; this name suggests a reformulation, not confident which id the team wants) | no | no |
| `Face Mist (Aloevera).jpeg` | .jpeg | `aloe-vera-mist` | yes (`aloe-vera-mist`, mists) | no |
| `Face Mist (Botanical Essence).jpeg` | .jpeg | UNSURE — no existing id resembles this; possibly a new mist or a `serums`-category item (category exists in `CATEGORIES` but has zero products) | no | no |
| `Face Mist (Cucumber).jpeg` | .jpeg | `cucumber-mist` | yes (`cucumber-mist`, mists) | no |
| `Face Mist (Neem).jpeg` | .jpeg | `neem-mist` | yes (`neem-mist`, mists) | no |
| `Face Mist(Lemon and Mint).jpeg` | .jpeg | UNSURE — `lemon-mint-mist` | no | no |
| `Face Mist(Rose Water).jpeg` | .jpeg | UNSURE — `rose-water-mist` | no | no |
| `Goat Milk And Tea Tree Handcrafted  Soap.jpeg` | .jpeg | UNSURE — `goat-milk-tea-tree-soap` | no | no |
| `Herbal Hair Oil.jpeg` | .jpeg | `herbal-hair-oil` | yes (`herbal-hair-oil`, hair-oils) | no |
| `Honey and Oats Handcrafted  Soap.jpeg` | .jpeg | `honey-oats-soap` | yes (`honey-oats-soap`, soaps) | no |
| `Kalonji Oil.jpeg` | .jpeg | `kalonji-oil` | yes (`kalonji-oil`, cold-pressed-oils) | no |
| `Sesame Seed Oil.jpeg` | .jpeg | UNSURE — `sesame-seed-oil` (new cold-pressed oil, no existing entry) | no | no |
| `Turmeric And Neem Handcrafted  Soap.jpeg` | .jpeg | UNSURE — `turmeric-neem-soap` | no | no |

## Proposed renames (NOT executed)

For files that map to an **existing** `products.js` id, each single photo
would need to be split into `-1`/`-2`/`-3` per that product's `images`
count, or `images` reduced to `1` if only one photo exists. Proposed
filenames assume one photo → `-1` only; confirm before treating a product as
single-image.

| current filename | proposed filename |
|---|---|
| `Almond Oil.jpeg` | `almond-oil-1.jpeg` |
| `Apricot Oil.jpeg` | `apricot-oil-1.jpeg` |
| `Face Mist (Aloevera).jpeg` | `aloe-vera-mist-1.jpeg` |
| `Face Mist (Cucumber).jpeg` | `cucumber-mist-1.jpeg` |
| `Face Mist (Neem).jpeg` | `neem-mist-1.jpeg` |
| `Herbal Hair Oil.jpeg` | `herbal-hair-oil-1.jpeg` |
| `Honey and Oats Handcrafted  Soap.jpeg` | `honey-oats-soap-1.jpeg` |
| `Kalonji Oil.jpeg` | `kalonji-oil-1.jpeg` |

For files with **no** existing `products.js` entry, a rename alone isn't
enough — a new entry (id, category, price, en/ar copy, etc.) needs to be
added to `products.js` first, per the id proposed in the table above (all
marked UNSURE — confirm the id and category before adding):

`Almond and Rose Handcrafted  Soap.jpeg`, `Aloevera and Cucumber Handcrafted  Soap.jpeg`,
`Amla Hair Oil.jpeg`, `Charcoal And Tea Tree Handcrafted  Soap.jpeg`,
`Face Mist (Botanical Essence).jpeg`, `Face Mist(Lemon and Mint).jpeg`,
`Face Mist(Rose Water).jpeg`, `Goat Milk And Tea Tree Handcrafted  Soap.jpeg`,
`Sesame Seed Oil.jpeg`, `Turmeric And Neem Handcrafted  Soap.jpeg`

Note: `imgSrc()` builds `.png` paths first — every file above is `.jpeg`, so
even after a correct rename, the browser will issue one failed `.png`
request and one failed `.jpg` request per image before `guard()` falls
through to `.jpeg`. Not blocking, but worth converting to `.png` (or `.jpg`)
at some point to avoid two wasted requests per product image.

## Flags

### Non-`.png` extension (all 18 files)
Every file in `assets/img/products/` is `.jpeg`. None are `.png`. See note
above on the two extra failed requests this costs per image via `guard()`.

### Filenames with spaces / capitals (all 18 files)
Every file uses Title Case with spaces (some with parentheses, some with
inconsistent spacing — e.g. `Face Mist (Aloevera).jpeg` has a space before
the parenthesis, `Face Mist(Lemon and Mint).jpeg` does not; `Almond and Rose
Handcrafted  Soap.jpeg` has a double space before "Soap"). None currently
match the required lowercase-with-dashes convention.

### Non-ASCII filenames
None found — all 18 filenames are plain ASCII.

### `products.js` entries with no matching image file
All 8 current products — because none of the 18 files on disk match the
`<id>-<n>.<ext>` pattern `imgSrc()` requires, **every** product currently
resolves to the placeholder on the live site:
`aloe-vera-mist`, `cucumber-mist`, `neem-mist`, `almond-oil`, `kalonji-oil`,
`apricot-oil`, `herbal-hair-oil`, `honey-oats-soap`.

Additionally, two products that existed in the *previous* image set
(`amla-hair-oil-1.png`, `charcoal-soap-1.png` — both now deleted per `git
status`) have no corresponding `products.js` entry today, and no correctly-
named replacement image either.

### Image files with no `products.js` entry
10 of the 18 files (see "Proposed renames" section above, second list) have
no corresponding entry in `products.js` at all — they're new products
(soaps, mists, oils) not yet defined in the data file.
