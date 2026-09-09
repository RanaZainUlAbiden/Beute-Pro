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

/* =============================================================
   WELCOME POPUP

   The grand-opening note, shown a few seconds after the visitor
   lands — on whatever page they landed on.

   Nothing is persisted: every page load arms it again, so a
   reload or a fresh tab shows it once more.

   It lives in the shell rather than on a page, so a client-side
   navigation does not re-arm it mid-visit, and it renders
   nothing at all until the browser opens it: the prerendered
   HTML carries no overlay, so a visitor whose JS never runs sees
   no popup and is never left under a stuck one.

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
     404 or decode failure → skip the popup entirely. An overlay
                        with a hole in it is worse than no
                        overlay.
   ============================================================= */

/** Long enough to read the page first, short enough to still be a welcome. */
const DELAY_MS = 6000;
/** Something else owns the screen — look again shortly. */
const RETRY_MS = 4000;
/** The artwork, in the two forms the panel offers. Keep both in step with the template. */
const ART_WEBP = '/popup.webp';
const ART_PNG = '/popup.png';
/** The most the popup will wait on the artwork before opening without it. */
const ART_WAIT_MS = 2000;

/** The <html> inline styles `holdScroll` may overwrite. */
type LockedProp = 'overflow' | 'scrollbarGutter' | 'paddingInlineEnd';

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
  /** The inline styles the lock overwrote on <html>, to put back on close. */
  private locked: Partial<Record<LockedProp, string>> | null = null;

  constructor() {
    // afterNextRender never runs on the server, which is what keeps the
    // timer and document out of the SSR pass.
    afterNextRender(() => {
      // Off the moment we know the popup is coming, not at the moment it
      // opens. index.html preloads the same file, so on a browser that takes
      // the WebP this is usually a cache hit and settles well inside DELAY_MS.
      this.artwork = this.warmArtwork();
      this.arm(DELAY_MS);
    });

    inject(DestroyRef).onDestroy(() => {
      this.gone = true;
      clearTimeout(this.timer);
      if (this.isOpen()) {
        this.layout.unlock();
        this.releaseScroll();
      }
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

  /**
   * Stops the page scrolling under the overlay.
   *
   * `body.is-locked{overflow:hidden}` cannot do this on its own: the viewport
   * takes its overflow from <html>, and html carries `overflow-x:hidden`
   * (styles.scss), so the body rule never propagates and the page goes on
   * scrolling behind the overlay. The element the viewport actually reads is
   * locked here instead; `layout.lock()` still runs for everything else that
   * watches `is-locked`, the WhatsApp button among them.
   *
   * The scroll position is untouched: `overflow:hidden` freezes the scroller
   * where it stands rather than sending it home.
   */
  private holdScroll(): void {
    const root = this.doc.documentElement;
    const view = this.doc.defaultView;
    if (!view || this.locked) return;

    // Measured before the lock, while the scrollbar is still there to
    // measure: once overflow is hidden this difference is always zero.
    const gutter = view.innerWidth - root.clientWidth;

    const was: Partial<Record<LockedProp, string>> = { overflow: root.style.overflow };
    root.style.overflow = 'hidden';

    // Hiding the scrollbar hands its width back to the layout, which would
    // widen the page — the fixed header included — for as long as the popup
    // is up, and snap it back on close. `scrollbar-gutter` holds the space
    // open instead, on whichever side the scrollbar is: the browser puts it
    // on the left in Arabic, and reserves it there too.
    if (gutter > 0) {
      if (view.CSS?.supports('scrollbar-gutter', 'stable')) {
        was.scrollbarGutter = root.style.scrollbarGutter;
        root.style.scrollbarGutter = 'stable';
      } else {
        // Without it, padding at least keeps the page's own content still;
        // fixed elements are beyond reach here and shift by the scrollbar.
        was.paddingInlineEnd = root.style.paddingInlineEnd;
        root.style.paddingInlineEnd = `${gutter}px`;
      }
    }

    this.locked = was;
  }

  /** Puts <html> back exactly as it was — including having had nothing set. */
  private releaseScroll(): void {
    const was = this.locked;
    if (!was) return;
    this.locked = null;

    const root = this.doc.documentElement;
    for (const [prop, value] of Object.entries(was)) {
      root.style[prop as LockedProp] = value;
    }
    // An empty style="" attribute is not what we found; leave none behind.
    if (root.getAttribute('style') === '') root.removeAttribute('style');
  }

  private open(): void {
    const active = this.doc.activeElement;
    this.returnTo = active instanceof HTMLElement ? active : null;

    this.isOpen.set(true);
    this.layout.lock();
    this.holdScroll();

    // The panel is behind an @if, so it exists only after this render.
    afterNextRender(() => this.panel()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.layout.unlock();
    this.releaseScroll();

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
