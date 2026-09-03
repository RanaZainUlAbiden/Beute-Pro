import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { CATEGORIES, PRODUCTS } from '../../core/data/products';
import { imgSrc } from '../../core/image';
import { AudioService } from '../../core/services/audio.service';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';
import { LayoutService } from '../../core/services/layout.service';
import { ScrollService } from '../../core/services/scroll.service';

/** Featured product in the Shop mega menu, sourced live from products.ts. */
const MEGA_FEATURED_ID = 'herbal-hair-oil';

export const CONCERNS = [
  'acne',
  'dullness',
  'dryness',
  'hairfall',
  'dandruff',
  'frizz',
] as const;

/* =============================================================
   HEADER — topbar, primary nav, Shop mega menu, mobile panel

   The desktop dropdown and the mobile accordion share one
   category list and one featured product, both read live from
   core/data/products.ts. Keeping that in a single component is
   what stops the two from silently drifting apart — the same
   reason the static site rendered them from one script rather
   than pasting the markup into all seven pages.
   ============================================================= */
@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ImgFallbackDirective],
  host: { '(document:keydown.escape)': 'closeMenu()' },
})
export class Header {
  protected readonly i18n = inject(I18nService);
  protected readonly cart = inject(CartService);
  protected readonly audio = inject(AudioService);
  private readonly layout = inject(LayoutService);
  private readonly scroll = inject(ScrollService);
  private readonly router = inject(Router);

  protected readonly categories = CATEGORIES;
  protected readonly concerns = CONCERNS;
  protected readonly imgSrc = imgSrc;

  protected readonly featured =
    PRODUCTS.find((p) => p.id === MEGA_FEATURED_ID) ?? PRODUCTS[0];

  private readonly trigger =
    viewChild.required<ElementRef<HTMLAnchorElement>>('megaTrigger');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('megaPanel');
  private readonly accPanel = viewChild.required<ElementRef<HTMLElement>>('accPanel');

  /* ---- which top-level entry is marked current ---- */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly section = computed(() => {
    const path = this.url().split('?')[0].split('#')[0];
    if (path === '/') return 'home';
    if (path.startsWith('/shop') || path.startsWith('/product')) return 'shop';
    if (path.startsWith('/about')) return 'about';
    if (path.startsWith('/contact')) return 'contact';
    return '';
  });

  /* ---- Shop mega menu (desktop) ---- */
  protected readonly megaOpen = signal(false);

  /* ---- mobile panel ---- */
  protected readonly menuOpen = signal(false);
  protected readonly accOpen = signal(false);

  /* ---- brand mark: logo-white.png → logo.png → wordmark ---- */
  protected readonly logoStep = signal(0);

  /* ---- header behaviour: transparent over a hero, solid once
     scrolled, hidden on the way down and back on the way up ---- */
  protected readonly stuck = signal(false);
  protected readonly hidden = signal(false);
  private lastY = 0;

  constructor() {
    effect(() => {
      const y = this.scroll.y();
      if (this.layout.noHero()) {
        this.stuck.set(false);
        this.layout.setScrolled(y > 60);
      } else {
        this.stuck.set(y > 60);
      }
      this.hidden.set(y > 320 && y > this.lastY && !this.menuOpen());
      this.lastY = y;
    });

    // the accordion animates on max-height, so a language change that
    // reflows its contents has to re-measure while it is open
    effect(() => {
      this.i18n.lang();
      if (this.accOpen()) queueMicrotask(() => this.measureAcc());
    });
  }

  protected openMega(): void {
    this.megaOpen.set(true);
  }

  protected closeMega(returnFocus = false): void {
    this.megaOpen.set(false);
    if (returnFocus) this.trigger().nativeElement.focus();
  }

  protected onMegaFocusOut(e: FocusEvent, wrap: HTMLElement): void {
    if (!wrap.contains(e.relatedTarget as Node | null)) this.closeMega();
  }

  protected onMegaKeydown(e: KeyboardEvent): void {
    const list = Array.from(
      this.panel().nativeElement.querySelectorAll<HTMLAnchorElement>('a[role="menuitem"]'),
    );
    if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLAnchorElement);

    if (e.key === 'Escape') {
      this.closeMega(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (document.activeElement === this.trigger().nativeElement) {
        this.openMega();
        list[0].focus();
      } else {
        list[Math.min(i + 1, list.length - 1)].focus();
      }
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (i <= 0) this.trigger().nativeElement.focus();
      else list[i - 1].focus();
    }
  }

  /* ---- mobile panel ---- */
  protected openMenu(): void {
    this.menuOpen.set(true);
    this.layout.lock();
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
    this.layout.unlock();
  }

  protected toggleAcc(): void {
    this.accOpen.update((v) => !v);
    queueMicrotask(() => this.measureAcc());
  }

  private measureAcc(): void {
    const el = this.accPanel().nativeElement;
    el.style.maxHeight = this.accOpen() ? `${el.scrollHeight}px` : '0';
  }

  protected onLogoError(): void {
    this.logoStep.update((s) => s + 1);
  }

  protected concernLabel(c: (typeof CONCERNS)[number]): string {
    return this.i18n.t(`concern.${c}`);
  }
}
