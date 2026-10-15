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

import type { ApiProduct } from '../../../core/models/api.model';
import { I18nService } from '../../../core/services/i18n.service';
import { MotionService } from '../../../core/services/motion.service';
import { ProductService } from '../../../services/product.service';
import { ProductCard } from '../../../shared/product-card/product-card';

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
  private readonly productService = inject(ProductService);
  protected readonly i18n = inject(I18nService);

  /** ✅ Badged products, loaded from the API. */
  protected readonly items = signal<ApiProduct[]>([]);

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');

  protected readonly progress = signal(0);
  protected readonly ratio = signal(0.3);
  protected readonly atStart = computed(() => this.progress() <= 0.001);
  protected readonly atEnd = computed(() => this.progress() >= 0.999);

  protected readonly thumbWidth = computed(() => `${Math.max(this.ratio(), 0.12) * 100}%`);
  protected readonly thumbOffset = computed(
    () => `${this.progress() * (100 - Math.max(this.ratio(), 0.12) * 100)}%`,
  );

  private raf = 0;

  constructor() {
    this.loadBadged();

    afterNextRender(() => {
      const el = this.viewport()?.nativeElement;
      if (!el) return;
      this.measure();

      this.zone.runOutsideAngular(() => {
        el.addEventListener('scroll', this.onScroll, { passive: true });
        el.addEventListener('wheel', this.onWheel, { passive: false });
        addEventListener('resize', this.onScroll, { passive: true });
      });
    });
  }

  /** Load only badged products, best sellers first, then other badges. */
  private loadBadged(): void {
    this.productService.list({ limit: 500 }).subscribe({
      next: (res) => {
        const best = res.products.filter((p) => p.badge === 'bestseller');
        const other = res.products.filter((p) => p.badge && p.badge !== 'bestseller');
        this.items.set([...best, ...other]);
        // Re-measure once items render (wait for the next frame)
        if (this.isBrowser) {
          requestAnimationFrame(() => this.measure());
        }
      },
      error: (err) => {
        console.error('Failed to load carousel products', err);
        this.items.set([]);
      },
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

  /* ---------- POSITION ---------- */
  private readonly onScroll = () => {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.zone.run(() => this.measure()));
  };

  private measure(): void {
    const el = this.viewport()?.nativeElement;
    if (!el) return;
    const travel = el.scrollWidth - el.clientWidth;
    this.ratio.set(el.scrollWidth ? el.clientWidth / el.scrollWidth : 1);
    this.progress.set(travel > 1 ? Math.min(1, Math.abs(el.scrollLeft) / travel) : 0);
  }

  /* ---------- INPUT ---------- */
  protected step(direction: 1 | -1): void {
    this.scrollBy(direction * (this.i18n.isRTL() ? -1 : 1) * this.cardStep());
  }

  protected onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    this.scrollBy((e.key === 'ArrowRight' ? 1 : -1) * this.cardStep());
  }

  private readonly onWheel = (e: WheelEvent) => {
    const el = this.viewport()?.nativeElement;
    if (!el || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const travel = el.scrollWidth - el.clientWidth;
    if (travel < 1) return;

    const rtl = this.i18n.isRTL();
    const at = Math.abs(el.scrollLeft);
    const forward = e.deltaY > 0;
    if ((forward && at >= travel - 1) || (!forward && at <= 1)) return;

    e.preventDefault();
    el.scrollLeft += rtl ? -e.deltaY : e.deltaY;
  };

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