# Homepage Design Plan — Béute Pro

Scope: `index.html` + `assets/css/style.css`, plus the two `i18n.js` keys noted
in §7. Palette, Manrope and the `:root` tokens are untouched.

---

## 1. The problem the page has today

The buyer's question is *"is this genuine, or repackaged?"* The current page
answers it by **asserting** eleven times and **showing** zero times:

| Block | What it does | Verdict |
|---|---|---|
| Marquee (7 claims) | asserts | cut |
| Why Béute Pro (5 cards) | asserts | cut |
| Stats (4 counters) | asserts | keep the numbers, move them |
| Process (8 steps) | describes | keep, quiet it |
| Factory photos | **shows** | currently 3 thumbs, 90px, in the footer |

The only genuine evidence on the page is 120px tall and below the fold of the
footer. That inversion is the whole redesign.

Second structural problem: **two product grids showing the same eight
products.** `#bestsellers` renders `PRODUCTS.filter(badge==='bestseller')`
padded to 4; `#allproducts` renders `PRODUCTS.slice(0,8)` — and `PRODUCTS` has
exactly 8 entries. The "best sellers" set is a subset of the "full range" set,
shown twice, 500px apart. One grid.

Eleven sections become seven.

---

## 2. The one bold moment

**Proposal: the factory section — "Nurtured, not manufactured" — is the bold
moment. Not the hero.**

The reasoning: a full-bleed hero is the default. Every skincare site has one,
so choosing it isn't a choice — it's the absence of one. The composition says
something only if the loudest thing on the page is the thing the buyer came to
verify. So the page's single scale break, its only full-viewport-width band,
and its largest images are all spent on the floor in Faisalabad.

What that means concretely:

- It is the only section that **breaks `--max`**. Everything else lives inside
  the 1340px wrap; the photo band runs edge to edge.
- Its images are the **tallest on the page** (4/5 at ~third-viewport width vs.
  1/1 product cards and 4/5 category tiles at a fifth).
- It is the only **full-bleed dark band** in the body of the page. Hero and
  footer are dark, but they're the bookends — a dark band in the middle is a
  deliberate interruption.
- It carries the three real photos, the three numbers, and the certification
  line, so every claim is standing next to the place it came from.

**The hero gets quieter to pay for it.** The video stays — it's new and it
works — but it stops competing: the certification pill comes off (those words
move to the floor section where a photo backs them), the height drops from
`100svh` to `clamp(560px, 82svh, 860px)` so the next section's edge shows, and
the four-step entrance cascade becomes one fade. It's still a full-bleed
video; it's just no longer shouting over the section that matters.

**The bold moment contains no animation.** It's bold through scale and
composition. See §5.

---

## 3. Section order

| # | Section | Job | Ground |
|---|---|---|---|
| 1 | Hero | The promise, one primary action | dark (video) |
| 2 | Categories | "What do you sell" — navigation, 5 tiles | ivory |
| 3 | The range | Commerce. 8 products, one grid, prices visible early | ivory-2 |
| 4 | **Our floor** `#feature` | **The proof.** Photos, numbers, certs | **dark, full-bleed** |
| 5 | How it's made | The 8-step process — the argument in words | ivory |
| 6 | Your routine | 01/02/03 + model shot. "How do I use it" | ivory-2 |
| 7 | Newsletter | Capture | ivory (dark card) |
| — | Footer | | dark |

Changes from today:

- **Marquee** — cut. Seven uppercase claims scrolling past is the least
  credible way to make a claim.
- **Why Béute Pro (5 cards)** — cut. The words survive as one static line
  inside §4: *Halal certified · ISO & GMP · Paraben & sulphate free · Cruelty
  free*. Same information, standing next to the facility instead of five
  hover-sweep cards.
- **Stats strip** — cut as a standalone section; the numbers move inside §4 as
  evidence attached to the place. Counters become static text (§5).
- **Best sellers** — cut as a separate grid; merged into §3.
- **Commerce moves up.** Today a shopper sees a price at section 5. Now at 3.
- **Proof moves up 5 places.** Today the factory is footer thumbs. Now it's
  the centre of the page.

**Anchor note:** `shop.html` and `product.html` link "Our Story" to
`index.html#feature` (3 places each). `id="feature"` moves onto the floor
section — which is a better destination for "Our Story" than the routine block
it currently points at, and keeps six existing links working. Nav "Our Story"
on the homepage points there too.

---

## 4. Wireframes

### 4.1 Full page — desktop (≥1025px)

```
╔══════════════════════════════════════════════════════════════════════╗
║ topbar: mail                              login · track · wishlist   ║
║ ── logo ───────  Home Shop Story Journal Contact ───  ع 🔊 🔍 🛒 ☰  ║  fixed
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  [ video, scrim from the inline-start edge ]                         ║
║                                                                      ║
║   Skin that remembers                                                ║  clamp(560px,
║   how to glow.                                                       ║  82svh, 860px)
║   Cold-pressed oils, handcrafted soaps and botanical mists —         ║
║   made in small batches from ingredients you can pronounce.          ║  ← no cert pill
║                                                                      ║
║   [ Shop the range ]  [ How we make it → #feature ]                  ║
╠══════════════════════════════════════════════════════════════════════╣
   ↑ next section's edge is visible at rest — the page reads as scrollable

   Everything for skin, hair and body.        View all products
   ────────────────────────────────────────────────────────────
   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
   │       │ │       │ │       │ │       │ │       │            5 tiles, 4/5
   │       │ │       │ │       │ │       │ │       │
   └───────┘ └───────┘ └───────┘ └───────┘ └───────┘
   Face Mists Serums    Soaps     Cold Pr.  Hair Oils
   Shop now   Shop now  Shop now  Shop now  Shop now   ← no arrow glyph

════════════════════════════════════════════ ivory-2 ═══════════════════

                        Chosen with care.
        Browse everything, or narrow it down by what your skin
                       needs today.

   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
   │  ▢    │ │  ▢    │ │  ▢    │ │  ▢    │        one grid, 8 products
   └───────┘ └───────┘ └───────┘ └───────┘        (was two grids × same 8)
    CATEGORY   CATEGORY  CATEGORY  CATEGORY
    Name       Name      Name      Name
    ₨ 800      ₨ 800     ₨ 3,000   ₨ 3,000
   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
   │  ▢    │ │  ▢    │ │  ▢    │ │  ▢    │
   └───────┘ └───────┘ └───────┘ └───────┘
    …

                    [ View all products ]

╔═══════════ THE BOLD MOMENT — full bleed, breaks --max ════════════════╗
║ deep green                                                            ║
║   ┌─ wrap ────────────────────────────────────────────────────┐       ║
║   │  Nurtured, not manufactured.          Every product is    │       ║
║   │                                       made on our own     │       ║
║   │  ── 12 ──── 150 ──── 17 ──          floor in Faisalabad — │       ║
║   │  years  batch    herbs in            formulated, filled,  │       ║
║   │  making  size,   our hair            labelled and checked │       ║
║   │  skincare never  oil                 by the same team.    │       ║
║   │          mass                        Nothing is           │       ║
║   │          runs                        outsourced.          │       ║
║   │                                                           │       ║
║   │                                       Self care should    │       ║
║   │                                       work in harmony     │       ║
║   │                                       with your body.     │       ║
║   └───────────────────────────────────────────────────────────┘       ║
║                                                                       ║
║ ┌──────────────────┬──────────────────┬──────────────────┐            ║
║ │                  │                  │                  │            ║
║ │   factory-1      │   factory-2      │   factory-3      │  ← tallest ║
║ │                  │                  │                  │    images  ║
║ │      4/5         │      4/5         │      4/5         │    on the  ║
║ │                  │                  │                  │    page    ║
║ └──────────────────┴──────────────────┴──────────────────┘            ║
║  Our floor,         The same team,     Checked by hand                ║
║  Faisalabad         every batch        before it ships    ← see §8    ║
║  ↑ full viewport width, no wrap padding, no gutter at the edges       ║
║                                                                       ║
║   ┌─ wrap ────────────────────────────────────────────────────┐       ║
║   │  Halal certified · ISO & GMP · Paraben & sulphate free ·  │       ║
║   │  Cruelty free                     Inside the workshop     │       ║
║   └───────────────────────────────────────────────────────────┘       ║
╚═══════════════════════════════════════════════════════════════════════╝
   ↑ the only mid-page dark band, the only full-bleed block, the only
     place the grid breaks. Nothing else on the page does any of these.

   Eight steps from raw herb to sealed bottle.
   No guesswork and no gaps. Every batch is tested before it leaves.

   ┌──┐ ── ┌──┐ ── ┌──┐ ── ┌──┐         static hairline connector,
   │01│    │02│    │03│    │04│         no draw-in on scroll
   └──┘    └──┘    └──┘    └──┘
   Sourcing Formul. Cold P. Blending
   …        …       …       …
   ┌──┐ ── ┌──┐ ── ┌──┐ ── ┌──┐
   │05│    │06│    │07│    │08│
   └──┘    └──┘    └──┘    └──┘
   Lab Test Filling QC      Delivery

════════════════════════════════════════════ ivory-2 ═══════════════════

   ┌────────────────────────┐   A routine that fits the day
   │                        │   you actually have.
   │   model/feature.jpg    │   Three steps, two minutes.
   │        4/5             │
   │                        │   (01)  Cleanse gently
   │        ┌────────────┐  │        Handcrafted soap, no harsh…
   │        │▢ Aloe Mist │  │
   │        │  ₨ 800     │  │   (02)  Hydrate in seconds
   │        └────────────┘  │        A botanical mist over clean…
   └────────────────────────┘
                                (03)  Seal it in
                                     Two drops of cold-pressed oil…

                                [ Build your routine ]
   ↑ 01/02/03 markers stay — this content really is a sequence.
     Section flips from dark green to light so §4 keeps the dark band.

   ┌──────────────────────────────────────────────────────────┐
   │  green-2 card                                            │
   │        Ten percent off, and the honest emails.           │
   │        [ your email address        ] [ Subscribe ]       │
   └──────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║ logo        Navigation      Shop            Follow us                ║
║ about copy  Home            Face Mists      f  ig  yt  wa            ║
║             Shop            Serums                                   ║
║             Our Story       Soaps           ← was 3 factory thumbs;  ║
║             …               …                 the photos are the     ║
║ ──────────────────────────────────────────    page's centrepiece     ║
║ © 2026 Béute Pro                              now, don't repeat them ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 4.2 Our floor — mobile (≤680px, checked at 360px)

The three photos become a swipe row with CSS scroll-snap rather than three
stacked 4/5 images (which would be ~1400px of scrolling for one section). The
partial third card at the edge is what tells you it's swipeable — no dots, no
arrows, no JS.

```
┌────────────────────────────┐  360px
│ deep green                 │
│                            │
│ Nurtured, not              │
│ manufactured.              │
│                            │
│ Every product is made on   │
│ our own floor in           │
│ Faisalabad — formulated,   │
│ filled, labelled and       │
│ checked by the same team.  │
│ Nothing is outsourced.     │
│                            │
│  12        150       17    │  three numbers, one row, no counting
│  years     batch     herbs │  animation
│                            │
├────────────────────────────┤ ← photo row is full-bleed, ignores --gut
│ ┌────────────┐ ┌───────────│
│ │            │ │           │  scroll-snap-type: x mandatory
│ │  factory-1 │ │  factory- │  78vw cards, next one peeks
│ │            │ │           │  tabindex="0" + focus ring
│ │            │ │           │
│ └────────────┘ └───────────│
│  Our floor,      The same  │
│  Faisalabad      team, ev… │
├────────────────────────────┤
│ Halal certified ·          │
│ ISO & GMP · Paraben &      │
│ sulphate free ·            │
│ Cruelty free               │
│                            │
│ Inside the workshop        │
└────────────────────────────┘
```

### 4.3 Rest of the page — mobile

```
Hero        1 col, copy bottom-aligned, both CTAs full width at ≤430px
Categories  2 cols (all 5 shown, 5th spans full width)
Range       2 cols × 4 rows
Process     1 col, vertical connector (existing behaviour, kept, static)
Routine     photo first, then copy — existing order:-1, kept
Newsletter  input + button stacked at ≤430px
Footer      2 cols, first and last span full width
```

---

## 5. Where motion belongs

Rule applied: **motion that answers a user action stays; motion that plays at
the page stays only in the hero entrance.** Net result — no scroll-triggered
animation anywhere on the homepage.

### Kept

| Motion | Why it earns its place |
|---|---|
| Header solid-on-scroll, hide-down / show-up | Responds to scroll direction — it's reading your intent, not decorating |
| Hero entrance fade | The page arriving. **One** fade on `.hero__copy` as a block, ~500ms — replaces today's four-child cascade |
| Hero video loop | It's the hero's medium, not an animation layer |
| Button hover/`:focus-visible` | Action affordance |
| Product card: quick-add slides up on hover/focus | Answers hover intent — reveals a control that wasn't there |
| Category tile: scrim + name colour on hover | Cheapest possible "this is a link" |
| Cart drawer, menu panel, toast | Direct results of a click |
| Mobile photo row scroll-snap | Answers a swipe |
| Back-to-top | It's a button |

### Cut

| Motion | Where | Why |
|---|---|---|
| `.reveal` fade-ups | every section head + 4 blocks | Content hidden until scrolled-to, for no reason. Also means a JS hiccup = blank page |
| `.stagger` on both grids | `#cats`, product grids | Same, and `opacity:0` on children is a real failure mode |
| `data-split` word-by-word headlines | 7 headlines | The single most decorative thing on the page |
| Counters counting up | stats | Numbers that animate read as a demo, not a fact |
| Marquee scroll + scroll-speed nudge | marquee | Section removed |
| `.wcard` gold sweep, icon draw-in, `rotate(-6deg)` on hover | why | Section removed |
| Process connector drawing itself in | `.pstep::before` | Becomes a static hairline. Requires a CSS change: today the rule sits at `scaleX(0)` until `.process.is-in` lands, so dropping the observer class without editing the CSS would leave the connectors invisible |
| Product card hover lift + image `scale(1.12)` | `.pcard` | The lift and the zoom do nothing the border change doesn't. Keeping quick-add + a gold border is enough |
| Category tile image `scale(1.07)` | `.cat` | ditto |
| Scroll progress bar | `.progress` | A reading-progress affordance on a storefront |
| Gold `.bloom` radial blobs | 2 dark sections | Both host sections are gone |

**`.pcard` note:** that hover rule is shared with `shop.html`, which renders
the same card component through `renderGrid`. Quieting it changes the shop grid
too. I think that's correct — one card behaviour across the site — but it is a
visible change to a page outside the stated scope, so flagging it rather than
doing it silently. Say the word if you'd rather I scope it to
`.section--range .pcard` and leave shop alone.

**Reduced motion.** The five existing `@media(prefers-reduced-motion:reduce)`
blocks stay. Because almost all JS-driven motion is being removed rather than
added, there's little new to guard: the hero fade goes into the existing
`.hero__copy > *` reset in the first block, and the scroll-snap row gets
`scroll-behavior:auto`. No `motion.js` change is needed — every hook I'm
removing (`[data-count]`, `.stagger`, `[data-split]`, `.marquee__track`,
`[data-parallax]`) is queried defensively and no-ops when absent.

---

## 6. CSS work

**Deleted** (index-only, verified absent from `shop.html` / `product.html`):
`.marquee*`, `.why`, `.wcard*`, `.badges`/`.badge*`, `.stats`/`.stat`, and
their four responsive + reduced-motion overrides. Roughly 120 lines out.

**Kept even though the homepage stops using them** — `shop.html` and
`product.html` still depend on these: `.eyebrow`, `.eyebrow--dash`, `.reveal`,
`.stagger`, `.split`, `.bloom`, `.section--dark`, `.progress`.

**Modified:** `.hero` height + entrance, `.slide__scrim` (softer — less
contrast needed once the pill is gone), `.pcard` hover, `.cat` hover,
`.pstep::before` (static), `.feature` (dark green → light ground),
`.footer__grid` column 4, `.link-arrow` (arrow glyph out, gold underline
stays).

**New:** `.floor*` — the bold-moment section. ~90 lines. Full-bleed via
`width:100vw; margin-inline:calc(50% - 50vw)` on the photo band only, so the
copy stays inside `--max`.

New tokens: none needed. Everything uses `--green`, `--green-2`, `--gold`,
`--ivory`, `--ivory-2`, `--ivory-3`, `--gut`, `--section`, `--r`, `--r-lg`,
`--ease`, `--shadow`.

---

## 7. i18n

Nearly free, because `i18n.js` already carries a fully translated `story.*`
block that was written for exactly this section and is currently unused:

```
story.title  "Nurtured, not manufactured."
story.body   "Every product is made on our own floor in Faisalabad —
              formulated, filled, labelled and checked by the same team.
              Nothing is outsourced, which is why we can tell you exactly
              what is in the bottle and who put it there."
story.body2  "Self care should work in harmony with your body…"
story.cta    "Inside the workshop"
story.stat1/2/3
```

Also reused as-is: `st.2`/`st.3`/`st.4` (number labels), `pr.*` (process),
`mf.*` (routine), `cat.*`, `feat.*`, `news.*`, `foot.*`.

**New keys — 4 total, en + ar each:**

| Key | en |
|---|---|
| `floor.cap1` | Our floor, Faisalabad |
| `floor.cap2` | The same team, every batch |
| `floor.cap3` | Checked by hand before it ships |
| `floor.certs` | Halal certified · ISO & GMP · Paraben & sulphate free · Cruelty free |

`story.cta` gets an `href="#process"` anchor (there's no workshop page).

Retired from use, kept in the table: `marq.1–7`, `why.*`, `best.*`,
`cat.eyebrow`, `mf.eyebrow`, `feat.eyebrow`, `pr.eyebrow`, `hero.badge`.
Leaving them in `i18n.js` costs nothing and keeps the diff to `i18n.js` at
+8 lines.

---

## 8. Two things I need from you

**1. Photo captions.** `CLAUDE.md` forbids reading anything under
`assets/img/`, so I don't know what `factory-1/2/3.jpg` actually show. The
three captions in §7 are true of the operation regardless of what's in frame,
but a caption that names what you're looking at ("the cold press", "filling
line", "batch QC") is worth far more for the genuine-vs-repackaged question —
a generic caption on a real photo half-wastes the photo. Tell me what's in
each and I'll write them; otherwise I'll build with the neutral defaults and
you can swap four strings later.

**2. The `.pcard` hover change reaches `shop.html`** — see §5. Global, or
scoped to the homepage?

Neither blocks the build; I'll proceed with the defaults above unless you say
otherwise.

---

## 9. What I am not doing

- Not touching `products.js`, `main.js`, `product.js`, `motion.js`,
  `slider.js`, `shop.html`, `product.html`.
- Not rewriting copy. The H1 stays "Skin that remembers how to glow." —
  hierarchy is the brief, not voice.
- Not adding a testimonials, press, or certification-logo block. The facility
  is the trust argument; a second one would dilute it.
- Not designing anything that needs a second product photo or a hover swap —
  every card and chip uses `<id>-1.jpg` only.
- Not committing.

---

## 10. Build checklist (step 2, after approval)

- [ ] 360px: no horizontal overflow; photo row is the only x-scroller
- [ ] `dir="rtl"`: photo row scrolls right-to-left; full-bleed
      `margin-inline:calc(50% - 50vw)` is direction-agnostic; numbers row and
      floor grid mirror; connector gradient already has an RTL rule
- [ ] `:focus-visible` on: photo row container, category tiles, product cards,
      quick-add, every CTA, newsletter input
- [ ] Reduced motion: hero fade off, snap-scroll to `auto`
- [ ] `#feature` anchor resolves from `shop.html` and `product.html`
- [ ] No hardcoded hex, no raw px where a token exists
- [ ] Page renders correctly with JS disabled down to the two dynamic grids
      (nothing is hidden at `opacity:0` waiting for an observer)
```
