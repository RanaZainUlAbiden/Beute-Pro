# Béute Pro — Demo 2 "Verdant"

Deep green · gold · ivory. Clean sans throughout. No video — the hero is an
interactive slider instead. Background audio stays.

---

## Copy your Demo 1 assets straight over

Every path is identical to Demo 1, so drop your existing `assets/` folder in
and everything works:

```
assets/img/products/     all 24 product PNGs
assets/img/categories/   the 5 category tiles
assets/img/brand/        logo.png, logo-white.png, favicon.png
assets/img/about/        factory-1.jpg, factory-2.jpg, factory-3.jpg
assets/img/spin/         your frame-01.png … frame-10.png
assets/audio/ambient.mp3
```

**`assets/video/` is no longer used.** Nothing references `hero.mp4`.

---

## New: the model shots

One new folder, four files:

```
assets/img/model/slide-1.jpg     hero slide 1 — model + face mist
assets/img/model/slide-2.jpg     hero slide 2 — model + hair oil
assets/img/model/slide-3.jpg     hero slide 3 — model + cold pressed oil
assets/img/model/feature.jpg     the routine section, portrait crop
```

**What these shots need:**

- **Landscape, 1920×1080 or larger** for the three slides. `feature.jpg` is
  cropped 4:5 portrait on desktop, so shoot or crop it tall.
- **The model belongs on the right.** The headline, body copy and buttons sit
  on the left, and there's a dark gradient over that side. A face on the left
  will be half-hidden.
- **Leave the bottom-right corner clear.** The floating product card sits
  there on desktop.
- **Bright, warm, daylight.** A dark scrim goes on top; footage that's already
  moody turns to mud.
- **A product visible in her hand or beside her**, matching the slide. Slide 1
  is the aloe mist, slide 2 the herbal hair oil, slide 3 the almond oil.

Missing files aren't fatal — each slide falls back to a green and gold gradient
so you can see the layout working before the shoot.

## Changing which product a slide promotes

In `index.html`, each slide carries the product id:

```html
<article class="slide" data-product="herbal-hair-oil">
```

Change the id to any product from `products.js` and the floating card updates
by itself — name, category and price all follow.

## Slider timing

`assets/js/slider.js`, near the top:

```js
ms:6000,     // milliseconds per slide
```

---

## Adding a fourth slide

1. Copy a whole `<article class="slide">` block in `index.html`.
2. Add a matching `<button class="sdot"><i></i></button>` to `.hero__dots`.
3. Update the `/ 03` counter next to `#slide-num`.
