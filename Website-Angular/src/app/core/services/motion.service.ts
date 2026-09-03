import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/* =============================================================
   REVEAL ENGINE

   One IntersectionObserver for the whole app — the same single
   shared observer motion.js used, not one per element. Elements
   animate once, then stop being watched.

   Everything here degrades to nothing if the visitor has
   "reduce motion" switched on: the observer is never built and
   every element is marked in view straight away.
   ============================================================= */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly reduced =
    this.isBrowser && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private io: IntersectionObserver | null = null;

  private observer(): IntersectionObserver | null {
    if (!this.isBrowser || this.reduced) return null;
    this.io ??= new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-in');
          this.io?.unobserve(en.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );
    return this.io;
  }

  /** Watch an element, or mark it in view now under reduced motion. */
  observe(el: Element): void {
    const io = this.observer();
    if (!io) {
      if (this.isBrowser) el.classList.add('is-in');
      return;
    }
    if (!el.classList.contains('is-in')) io.observe(el);
  }

  unobserve(el: Element): void {
    this.io?.unobserve(el);
  }

  /** Re-arm a container whose contents were just re-rendered. */
  reset(el: Element): void {
    if (this.reduced || !this.isBrowser) return;
    el.classList.remove('is-in');
    this.observe(el);
  }
}
