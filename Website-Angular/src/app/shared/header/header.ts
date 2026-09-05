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
import { AuthService } from '../../services/auth';
import { ProfileDropdownComponent } from '../../features/auth/profile-dropdown/profile-dropdown';

// ✅ New imports for Search
import { SearchService } from '../../core/services/search.service';
import { SearchComponent } from '../../shared/search/search';

// ✅ Import environment for admin path
import { environment } from '../../../environments/environment';

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

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ImgFallbackDirective,
    ProfileDropdownComponent,
    SearchComponent,
  ],
  host: { '(document:keydown.escape)': 'closeMenu()' },
})
export class Header {
  protected readonly i18n = inject(I18nService);
  protected readonly cart = inject(CartService);
  protected readonly audio = inject(AudioService);
  private readonly layout = inject(LayoutService);
  private readonly scroll = inject(ScrollService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  private readonly searchService = inject(SearchService);

  protected readonly categories = CATEGORIES;
  protected readonly concerns = CONCERNS;
  protected readonly imgSrc = imgSrc;

  // ✅ Expose admin path for template
  protected readonly adminPath = environment.adminPath;

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
  private closeTimer: ReturnType<typeof setTimeout> | undefined;

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
      this.hidden.set(y > 320 && y > this.lastY && !this.menuOpen() && !this.megaOpen());
      this.lastY = y;
    });

    // the accordion animates on max-height, so a language change that
    // reflows its contents has to re-measure while it is open
    effect(() => {
      this.i18n.lang();
      if (this.accOpen()) queueMicrotask(() => this.measureAcc());
    });
  }

  // ---- Auth helpers for the template ----
  protected get user() {
    return this.auth.user$;
  }
  protected isLoggedIn = this.auth.isLoggedIn.bind(this.auth);
  protected isAdmin = this.auth.isAdmin.bind(this.auth); // ✅ expose admin check
  protected logout = this.auth.logout.bind(this.auth);
  protected goToLogin = () => this.router.navigate(['/login']);
  protected goToProfile = () => this.router.navigate(['/profile']);

  // ---- Search helper ----
  protected openSearch(): void {
    this.searchService.open();
  }

  /* ---- mega menu methods ---- */
  protected openMega(): void {
    clearTimeout(this.closeTimer);
    this.megaOpen.set(true);
  }

  protected closeMega(returnFocus = false, delay = 300): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => {
      this.megaOpen.set(false);
      if (returnFocus) this.trigger().nativeElement.focus();
    }, delay);
  }

  protected cancelClose(): void {
    clearTimeout(this.closeTimer);
    this.megaOpen.set(true);
  }

  protected onMegaFocusOut(e: FocusEvent, wrap: HTMLElement): void {
    if (!wrap.contains(e.relatedTarget as Node | null)) {
      this.closeMega(false, 0);
    }
  }

  protected onMegaKeydown(e: KeyboardEvent): void {
    const list = Array.from(
      this.panel().nativeElement.querySelectorAll<HTMLAnchorElement>('a[role="menuitem"]'),
    );
    if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLAnchorElement);

    if (e.key === 'Escape') {
      this.closeMega(true, 0);
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