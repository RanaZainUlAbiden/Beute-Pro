import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/* =============================================================
   One passive, rAF-throttled scroll listener for the whole app.

   motion.js registered a separate throttled listener per feature
   (header, progress bar, parallax, back-to-top). They all
   coalesced to a single frame anyway, so they share one here and
   read the same signal.
   ============================================================= */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** window.scrollY, updated at most once per animation frame. */
  readonly y = signal(0);
  /** Height of the scrollable overflow, for the progress bar. */
  readonly max = signal(0);
  /** innerHeight, for the back-to-top threshold. */
  readonly viewport = signal(0);

  private ticking = false;

  constructor() {
    if (!this.isBrowser) return;
    addEventListener(
      'scroll',
      () => {
        if (this.ticking) return;
        this.ticking = true;
        requestAnimationFrame(() => this.update());
      },
      { passive: true },
    );
    addEventListener('resize', () => this.update(), { passive: true });
    this.update();
  }

  /** Recompute now — call after a route change swaps the page height. */
  update(): void {
    if (!this.isBrowser) return;
    this.y.set(window.scrollY);
    this.viewport.set(innerHeight);
    this.max.set(document.documentElement.scrollHeight - innerHeight);
    this.ticking = false;
  }
}
