import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PRODUCTS } from '../../../core/data/products';
import type { Product } from '../../../core/models/product';
import { I18nService } from '../../../core/services/i18n.service';
import { MotionService } from '../../../core/services/motion.service';
import { ProductCard } from '../../../shared/product-card/product-card';

/* =============================================================
   PRODUCT CAROUSEL

   A horizontal row of cards beside a pinned section heading. The
   scrolling is the browser's: overflow-x with CSS scroll-snap, so
   a touch drag, a trackpad swipe, a scrollbar and a keyboard all
   work with no library and no dependency. What this class adds is
   only what CSS cannot do:

     - the progress indicator under the row, from scrollLeft
     - the two arrow buttons, one card per press
     - arrow keys on the focused row
     - a vertical wheel over the row scrolls it sideways, but only
       while it still has somewhere to go — at either end the page
       takes the gesture back, so the row never traps the scroll

   Nothing here auto-advances, under reduced motion or otherwise.
   Reduced motion only drops the smooth scroll animation; snapping
   still works, because that is the browser's, not ours.

   The cards come from PRODUCTS, and every word in them comes from
   the product data through app-product-card.
   ============================================================= */
@Component({
  selector: 'app-product-carousel',
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductCard],
})
export class ProductCarousel implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly motion = inject(MotionService);
  protected readonly i18n = inject(I18nService);

  /** The badged products, best sellers first, then the new arrivals. */
  protected readonly items: readonly Product[] = [
    ...PRODUCTS.filter((p) => p.badge === 'bestseller'),
    ...PRODUCTS.filter((p) => p.badge && p.badge !== 'bestseller'),
  ];

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');

  /** 0 → 1, how far through the row we are. 0 while it does not scroll. */
  protected readonly progress = signal(0);
  /* Visible share of the row, so the indicator reads as a scrollbar. The
     starting guess is only what the server renders and what a visitor
     with no JavaScript keeps — the first measurement replaces it. */
  protected readonly ratio = signal(0.3);
  protected readonly atStart = computed(() => this.progress() <= 0.001);
  protected readonly atEnd = computed(() => this.progress() >= 0.999);

  /** Indicator thumb: width is the visible share, offset is the travel. */
  protected readonly thumbWidth = computed(() => `${Math.max(this.ratio(), 0.12) * 100}%`);
  protected readonly thumbOffset = computed(
    () => `${this.progress() * (100 - Math.max(this.ratio(), 0.12) * 100)}%`,
  );

  private raf = 0;

  constructor() {
    afterNextRender(() => {
      const el = this.viewport()?.nativeElement;
      if (!el) return;
      this.measure();

      // scroll and wheel fire far too often to run change detection on
      // every one: they are read outside the zone and coalesced to a
      // frame, and only the resulting signal write re-enters it.
      this.zone.runOutsideAngular(() => {
        el.addEventListener('scroll', this.onScroll, { passive: true });
        el.addEventListener('wheel', this.onWheel, { passive: false });
        addEventListener('resize', this.onScroll, { passive: true });
      });
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    cancelAnimationFrame(this.raf);
    const el = this.viewport()?.nativeElement;
    el?.removeEventListener('scroll', this.onScroll);
    el?.removeEventListener('wheel', this.onWheel);
    removeEventListener('resize', this.onScroll);
  }

  /* =============================================================
     POSITION
     ============================================================= */
  private readonly onScroll = () => {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.zone.run(() => this.measure()));
  };

  /** In Arabic the row scrolls the other way: scrollLeft runs negative. */
  private measure(): void {
    const el = this.viewport()?.nativeElement;
    if (!el) return;
    const travel = el.scrollWidth - el.clientWidth;
    this.ratio.set(el.scrollWidth ? el.clientWidth / el.scrollWidth : 1);
    this.progress.set(travel > 1 ? Math.min(1, Math.abs(el.scrollLeft) / travel) : 0);
  }

  /* =============================================================
     INPUT
     ============================================================= */
  /** One card, in the direction the row reads: +1 is the next card. */
  protected step(direction: 1 | -1): void {
    this.scrollBy(direction * (this.i18n.isRTL() ? -1 : 1) * this.cardStep());
  }

  /** Arrow keys move the row the way they point, in both directions. */
  protected onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    this.scrollBy((e.key === 'ArrowRight' ? 1 : -1) * this.cardStep());
  }

  /* A vertical wheel over the row is only taken while the row can still
     move that way — at either end the event is left alone and the page
     scrolls on, so the section never becomes a scroll trap. */
  private readonly onWheel = (e: WheelEvent) => {
    const el = this.viewport()?.nativeElement;
    if (!el || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // already sideways
    const travel = el.scrollWidth - el.clientWidth;
    if (travel < 1) return;

    const rtl = this.i18n.isRTL();
    const at = Math.abs(el.scrollLeft);
    const forward = e.deltaY > 0;
    if ((forward && at >= travel - 1) || (!forward && at <= 1)) return;

    e.preventDefault();
    el.scrollLeft += rtl ? -e.deltaY : e.deltaY;
  };

  /** One card plus one gap, measured rather than assumed. */
  private cardStep(): number {
    const el = this.viewport()?.nativeElement;
    if (!el) return 0;
    const cards = el.querySelectorAll<HTMLElement>('.pcarousel__item');
    if (cards.length > 1) return Math.abs(cards[1].offsetLeft - cards[0].offsetLeft);
    return cards.length ? cards[0].offsetWidth : el.clientWidth * 0.8;
  }

  private scrollBy(left: number): void {
    this.viewport()?.nativeElement.scrollBy({
      left,
      behavior: this.motion.reduced ? 'auto' : 'smooth',
    });
  }
}
