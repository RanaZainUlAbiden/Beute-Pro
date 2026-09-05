import { Directive, ElementRef, inject } from '@angular/core';

import { PLACEHOLDER } from '../image';

/* =============================================================
   Images that may not exist yet.

   On error the src walks .webp → .png → .jpg → .jpeg → an inline
   SVG stand-in, in that order, by rewriting the extension. The
   stand-in also gets `.is-placeholder`, which CSS uses to inset
   it differently from a real cut-out photo.

   `data-fallback` is kept as the selector so the markup reads the
   same as the static site's. Unlike main.js's guard(), the chain
   restarts by itself whenever [src] is re-bound — no re-arming
   call after a thumbnail switch.
   ============================================================= */
@Directive({
  selector: 'img[data-fallback]',
  host: { '(error)': 'onError()' },
})
export class ImgFallbackDirective {
  private readonly img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  onError(): void {
    const src = this.img.getAttribute('src') ?? '';
    if (src === PLACEHOLDER || src === '') return; // nothing left to try

    if (src.endsWith('.webp')) {
      this.img.src = src.slice(0, -5) + '.png';
      return;
    }
    if (src.endsWith('.png')) {
      this.img.src = src.slice(0, -4) + '.jpg';
      return;
    }
    if (src.endsWith('.jpg')) {
      this.img.src = src.slice(0, -4) + '.jpeg';
      return;
    }
    this.img.src = PLACEHOLDER;
    this.img.classList.add('is-placeholder');
  }
}
