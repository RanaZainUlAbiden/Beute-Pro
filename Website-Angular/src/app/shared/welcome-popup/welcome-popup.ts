import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { I18nService } from '../../core/services/i18n.service';
import { LayoutService } from '../../core/services/layout.service';
import { StorageService } from '../../core/services/storage.service';

/* =============================================================
   WELCOME POPUP

   The grand-opening note, shown once per visitor a few seconds
   after they land — on whatever page they landed on.

   It lives in the shell rather than on a page, so navigating
   does not re-arm it, and it renders nothing at all until the
   browser opens it: the prerendered HTML carries no overlay, so
   a visitor whose JS never runs sees no popup and is never left
   under a stuck one.

   `bp_welcome_seen` is written the moment it opens, not on
   close — a visitor who leaves the page while it is up has
   still been shown it, and should not meet it again.

   THE ARTWORK IS THE POPUP. There is no copy in the panel, so
   an overlay without the image is an empty overlay. The image
   used to be fetched by the panel's own <img>, which the @if
   only creates at the moment of opening — the popup therefore
   opened first and the artwork landed in it afterwards, in
   plain view. Now the file is warmed as soon as we know the
   popup is due (and preloaded from index.html besides), and
   the open waits on it:

     decoded in time  → open, the artwork paints with the frame
     still in flight  → open at the cap anyway; the box is
                        already reserved at the right shape and
                        the bytes are moments away
     404 or decode failure → skip the popup entirely, and leave
                        `bp_welcome_seen` unwritten so the next
                        visit may still get it. An overlay with
                        a hole in it is worse than no overlay.
   ============================================================= */

/** Marked the moment the popup opens. Any value means "shown". */
const SEEN_KEY = 'bp_welcome_seen';
/** Long enough to read the page first, short enough to still be a welcome. */
const DELAY_MS = 6000;
/** Something else owns the screen — look again shortly. */
const RETRY_MS = 4000;
/** The artwork, in the two forms the panel offers. Keep both in step with the template. */
const ART_WEBP = '/popup.webp';
const ART_PNG = '/popup.png';
/** The most the popup will wait on the artwork before opening without it. */
const ART_WAIT_MS = 2000;

/** Anything that can hold focus inside the panel, in DOM order. */
const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-welcome-popup',
  templateUrl: './welcome-popup.html',
  styleUrl: './welcome-popup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePopup {
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly store = inject(StorageService);
  private readonly layout = inject(LayoutService);
  protected readonly i18n = inject(I18nService);

  protected readonly isOpen = signal(false);

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  private timer: ReturnType<typeof setTimeout> | undefined;
  /** Whatever had focus when the popup took it, to hand it back on close. */
  private returnTo: HTMLElement | null = null;
  /**
   * True once the artwork is fetched and decoded, false if it never will be.
   * Set only on the browser pass, before the timer that consumes it.
   */
  private artwork: Promise<boolean> | undefined;
  /** The component went away while `maybeOpen` was waiting on the artwork. */
  private gone = false;

  constructor() {
    // afterNextRender never runs on the server, which is what keeps the
    // timer, localStorage and document out of the SSR pass.
    afterNextRender(() => {
      if (this.store.get(SEEN_KEY)) return;
      // Off the moment we know the popup is coming, not at the moment it
      // opens. index.html preloads the same file, so on a browser that takes
      // the WebP this is usually a cache hit and settles well inside DELAY_MS.
      this.artwork = this.warmArtwork();
      this.arm(DELAY_MS);
    });

    inject(DestroyRef).onDestroy(() => {
      this.gone = true;
      clearTimeout(this.timer);
      if (this.isOpen()) this.layout.unlock();
    });
  }

  private arm(ms: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.maybeOpen(), ms);
  }

  /** Never lands on top of the cart drawer or the mobile menu — those hold `is-locked`. */
  private async maybeOpen(): Promise<void> {
    if (this.doc.body.classList.contains('is-locked')) {
      this.arm(RETRY_MS);
      return;
    }

    let cap: ReturnType<typeof setTimeout> | undefined;
    const capped = new Promise<'slow'>((resolve) => {
      cap = setTimeout(() => resolve('slow'), ART_WAIT_MS);
    });

    const ready = await Promise.race([this.artwork ?? Promise.resolve(true), capped]);
    clearTimeout(cap);

    // A definite failure is the only thing that cancels the popup; 'slow'
    // just means the bytes are still coming, and the panel reserves their
    // box, so opening on top of them costs nothing.
    if (ready === false) return;
    if (this.gone) return;
    // The wait is a window like any other: the cart drawer may have opened
    // inside it, so the lock is worth asking about a second time.
    if (this.doc.body.classList.contains('is-locked')) {
      this.arm(RETRY_MS);
      return;
    }

    this.open();
  }

  /**
   * Fetches and decodes the artwork ahead of the panel that will show it.
   *
   * The probe is a detached <picture>, not a bare `new Image()`, so the
   * browser runs the very same source selection the template will: a plain
   * Image would ask for the WebP even where WebP is unsupported, fail, and
   * report a failure the panel itself would never have had.
   */
  private warmArtwork(): Promise<boolean> {
    const picture = this.doc.createElement('picture');
    const source = this.doc.createElement('source');
    source.type = 'image/webp';
    source.srcset = ART_WEBP;
    const img = this.doc.createElement('img');
    picture.append(source, img);

    const loaded = new Promise<boolean>((resolve) => {
      img.addEventListener('load', () => resolve(true), { once: true });
      img.addEventListener('error', () => resolve(false), { once: true });
    });
    // Listeners first, then the src: selection runs here, with the <source>
    // already in place, and a cache hit still reports through the events.
    img.src = ART_PNG;

    return loaded.then(async (ok) => {
      if (!ok) return false;
      // Decoded here too, off the main thread, so handing the bitmap to the
      // panel cannot stall the frame the popup opens on.
      try {
        await img.decode();
      } catch {
        // A refused decode on an image that loaded is not a missing image.
      }
      return true;
    });
  }

  private open(): void {
    this.store.set(SEEN_KEY, '1');
    const active = this.doc.activeElement;
    this.returnTo = active instanceof HTMLElement ? active : null;

    this.isOpen.set(true);
    this.layout.lock();

    // The panel is behind an @if, so it exists only after this render.
    afterNextRender(() => this.panel()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.layout.unlock();

    // Focus goes back where it was — unless that was the body, or an
    // element the page has since replaced.
    const back = this.returnTo;
    this.returnTo = null;
    if (back && back !== this.doc.body && back.isConnected) back.focus();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  /** Tab and Shift+Tab wrap inside the panel while it is open. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.panel()?.nativeElement;
    if (!panel) return;

    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const active = this.doc.activeElement;

    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
