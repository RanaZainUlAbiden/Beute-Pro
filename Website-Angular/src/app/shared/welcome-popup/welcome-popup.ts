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
   ============================================================= */

/** Marked the moment the popup opens. Any value means "shown". */
const SEEN_KEY = 'bp_welcome_seen';
/** Long enough to read the page first, short enough to still be a welcome. */
const DELAY_MS = 6000;
/** Something else owns the screen — look again shortly. */
const RETRY_MS = 4000;

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

  constructor() {
    // afterNextRender never runs on the server, which is what keeps the
    // timer, localStorage and document out of the SSR pass.
    afterNextRender(() => {
      if (this.store.get(SEEN_KEY)) return;
      this.arm(DELAY_MS);
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      if (this.isOpen()) this.layout.unlock();
    });
  }

  private arm(ms: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.maybeOpen(), ms);
  }

  /** Never lands on top of the cart drawer or the mobile menu — those hold `is-locked`. */
  private maybeOpen(): void {
    if (this.doc.body.classList.contains('is-locked')) {
      this.arm(RETRY_MS);
      return;
    }
    this.open();
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
