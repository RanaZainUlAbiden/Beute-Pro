import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

/* =============================================================
   Body-level state that CSS reads

   `no-hero`  — page starts below the header instead of under it
   `scrolled` — set by the header watcher on a no-hero page
   `is-locked`— a drawer or the menu panel owns the scroll

   is-locked is add/remove, not a counter, exactly as in main.js:
   closing either the cart or the menu clears it.
   ============================================================= */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly doc = inject(DOCUMENT);

  /** Whether the current route sits below the header rather than under it. */
  readonly noHero = signal(false);
  /** Whether the current route shows the scroll-progress bar. */
  readonly progress = signal(false);
  /** Whether the current route shows the site header/footer — off for the admin panel. */
  readonly chrome = signal(true);

  setChrome(on: boolean): void {
    this.chrome.set(on);
    // No header is rendered, so nothing reserves `--head-h` at the top —
    // the no-hero padding-top (and its scrolled variant) would otherwise
    // leave a blank gap where the header used to be.
    if (!on) {
      this.doc.body.classList.remove('no-hero', 'scrolled');
    }
  }

  setNoHero(on: boolean): void {
    this.noHero.set(on);
    this.doc.body.classList.toggle('no-hero', on);
    if (!on) this.doc.body.classList.remove('scrolled');
  }

  setScrolled(on: boolean): void {
    this.doc.body.classList.toggle('scrolled', on);
  }

  lock(): void {
    this.doc.body.classList.add('is-locked');
  }

  unlock(): void {
    this.doc.body.classList.remove('is-locked');
  }
}
