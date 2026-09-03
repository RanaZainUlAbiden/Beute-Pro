/* =============================================================
   IMAGE PATHS, with a graceful stand-in
   -------------------------------------------------------------
   Ported verbatim from main.js. Paths are root-absolute here
   (`/assets/...`) rather than relative (`assets/...`), because a
   routed URL like /product/almond-oil would otherwise resolve a
   relative path against /product/. Nothing else changed.
   ============================================================= */

export const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#F7E7E3"/>
  <g fill="none" stroke="#D9B3AC" stroke-width="4" stroke-linejoin="round">
    <rect x="118" y="96" width="64" height="130" rx="9"/>
    <rect x="134" y="68" width="32" height="28" rx="5"/>
    <path d="M140 60h20"/>
  </g>
  <circle cx="150" cy="160" r="18" fill="none" stroke="#E2C0BA" stroke-width="3"/>
  <text x="150" y="262" text-anchor="middle" font-family="sans-serif" font-size="13"
        letter-spacing="2" fill="#C08A85">PHOTO PENDING</text>
</svg>`);

/* PNG first (transparent cut-outs), then JPG, then the stand-in —
   see ImgFallbackDirective for the walk down that chain. */
export function imgSrc(id: string, n = 1): string {
  return `/assets/img/products/${id}-${n}.png`;
}

export function catSrc(id: string): string {
  return `/assets/img/categories/${id}.jpg`;
}

/** The short looping 360° clip, one per product where it exists. */
export function spinSrc(id: string): string {
  return `/assets/video/spin/${id}.mp4`;
}
