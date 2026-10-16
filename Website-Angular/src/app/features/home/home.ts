import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { catSrc, mediaUrl, imgDims, spinSrc, mediaVideoUrl } from '../../core/image';
import type { TranslationKey } from '../../core/data/i18n.data';
import { ApiProduct, ApiCategory } from '../../core/models/api.model';
import { I18nService } from '../../core/services/i18n.service';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Marquee } from '../../shared/marquee/marquee';
import { PageHero } from '../../shared/page-hero/page-hero';
import { VideoFigure } from '../../shared/video-figure/video-figure';
import { ProductCarousel } from './product-carousel/product-carousel';

const MARQUEE: readonly TranslationKey[] = ['marq.2', 'marq.3', 'marq.4', 'marq.5', 'marq.7'];
const ROUTINE_CHIP_ID = 'aloe-vera-mist';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ImgFallbackDirective,
    RevealDirective,
    Marquee,
    PageHero,
    ProductCarousel,
    VideoFigure,
    NgOptimizedImage,
  ],
})
export class Home implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  protected readonly i18n = inject(I18nService);
  private readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);
  private readonly toast = inject(ToastService);

  protected readonly catSrc = catSrc;
  protected readonly mediaUrl = mediaUrl;
  protected readonly imgDims = imgDims;

  // ✅ Loaded from API
  protected readonly categories = signal<ApiCategory[]>([]);
  private readonly products = signal<ApiProduct[]>([]);

  /** The product that floats over the routine photo — null until loaded. */
  protected readonly chip = computed<ApiProduct | null>(() => {
    const list = this.products();
    if (!list.length) return null;
    return list.find((p) => p.id === ROUTINE_CHIP_ID) ?? list[0];
  });

  protected readonly marqueeStrip = computed(() =>
    MARQUEE.map((key) => this.i18n.t(key)).join(' · '),
  );

  /* ---------- spotlight ---------- */
  private readonly spotEl = viewChild<ElementRef<HTMLElement>>('spotlight');
  private readonly spotMedia = viewChild<ElementRef<HTMLElement>>('spotMedia');
  private readonly spotVideo = viewChild<ElementRef<HTMLVideoElement>>('spotVideo');

  protected readonly spotProduct = signal<ApiProduct | null>(null);
  protected readonly spotDragging = signal(false);
  protected readonly spotAria = computed(() => {
    const p = this.spotProduct();
    return p ? `${this.i18n.copy(p as any).name} — ${this.i18n.t('pdp.draghint')}` : '360° view';
  });

  private spotVisible = false;
  private spotAttached = false;
  private spotIo: IntersectionObserver | undefined;
  private dragAxis: 'x' | 'y' | null = null;
  private sx = 0;
  private sy = 0;
  private startTime = 0;

  /* ---------- newsletter ---------- */
  protected readonly email = signal('');

  constructor() {
    this.loadData();

    afterNextRender(() => {
      this.zone.runOutsideAngular(() => {
        addEventListener('mousemove', this.onWindowMove);
        addEventListener('mouseup', this.onWindowUp);
        addEventListener('touchend', this.onWindowUp);
      });
    });

    afterRenderEffect(() => {
      this.spotProduct();
      this.attachSpotlight();
    });

    effect(() => {
      this.scroll.y();
      if (this.spotVisible) this.scrubToScroll();
    });
  }

  private loadData(): void {
    this.categoryService.list().subscribe({
      next: (res) => this.categories.set(res.categories),
      error: (err) => console.error('Failed to load categories', err),
    });
    this.productService.list({ limit: 500 }).subscribe({
      next: (res) => {
        this.products.set(res.products);
        // pick the first product with a 360° video for the spotlight
        const spot = res.products.find((p) => mediaVideoUrl(p) || p.spin) ?? null;
        if (spot) this.spotProduct.set(spot);
      },
      error: (err) => console.error('Failed to load products', err),
    });
  }

  private readonly onWindowMove = (e: MouseEvent) => this.spotMove(e);
  private readonly onWindowUp = () => this.spotEnd();

  ngOnDestroy(): void {
    this.spotIo?.disconnect();
    if (!this.isBrowser) return;
    removeEventListener('mousemove', this.onWindowMove);
    removeEventListener('mouseup', this.onWindowUp);
    removeEventListener('touchend', this.onWindowUp);
  }

  /* ---------- SPOTLIGHT ---------- */
  private attachSpotlight(): void {
    const product = this.spotProduct();
    if (!product || this.spotAttached) return;
    const video = this.spotVideo()?.nativeElement;
    const el = this.spotEl()?.nativeElement;
    if (!video || !el) return;
    this.spotAttached = true;

    video.poster = mediaUrl(product, 0);
    video.muted = true;
    if (this.motion.reduced) video.removeAttribute('autoplay');
    video.src = mediaVideoUrl(product) ?? spinSrc(product.id);

    if (this.motion.reduced) return;
    this.spotIo = new IntersectionObserver(
      (entries) => {
        this.spotVisible = entries[0].isIntersecting;
        if (this.spotVisible) this.scrubToScroll();
      },
      { rootMargin: '20% 0px' },
    );
    this.spotIo.observe(el);
  }

  private scrubToScroll(): void {
    const video = this.spotVideo()?.nativeElement;
    const el = this.spotEl()?.nativeElement;
    if (!video?.duration || !el || this.spotDragging() || this.motion.reduced) return;
    const r = el.getBoundingClientRect();
    const total = r.height + innerHeight;
    const traveled = innerHeight - r.top;
    const progress = Math.min(1, Math.max(0, traveled / total));
    video.currentTime = progress * video.duration;
  }

  protected spotStart(e: MouseEvent | TouchEvent): void {
    const video = this.spotVideo()?.nativeElement;
    if (!video) return;
    const p = 'touches' in e ? e.touches[0] : e;
    this.sx = p.clientX;
    this.sy = p.clientY;
    this.dragAxis = null;
    this.startTime = video.currentTime || 0;
    this.spotDragging.set(true);
  }

  protected spotMove(e: MouseEvent | TouchEvent): void {
    if (!this.spotDragging()) return;
    const p = 'touches' in e ? e.touches[0] : e;
    const dx = p.clientX - this.sx;
    const dy = p.clientY - this.sy;
    if (this.dragAxis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      this.dragAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (this.dragAxis === 'y') return this.spotEnd();
    }
    if (this.dragAxis !== 'x') return;
    e.preventDefault();
    this.spotScrub(p.clientX);
  }

  protected spotEnd(): void {
    if (!this.spotDragging()) return;
    this.spotDragging.set(false);
    this.scrubToScroll();
  }

  private spotScrub(clientX: number): void {
    const video = this.spotVideo()?.nativeElement;
    const box = this.spotMedia()?.nativeElement;
    if (!video?.duration || !box) return;
    const rect = box.getBoundingClientRect();
    const dir = this.i18n.isRTL() ? -1 : 1;
    const time = this.startTime + ((clientX - this.sx) / rect.width) * video.duration * dir;
    video.currentTime = ((time % video.duration) + video.duration) % video.duration;
  }

  protected spotKeydown(e: KeyboardEvent): void {
    const video = this.spotVideo()?.nativeElement;
    if (!video?.duration) return;
    const dir = this.i18n.isRTL() ? -1 : 1;
    const step = video.duration / 24;
    let time = video.currentTime;
    if (e.key === 'ArrowRight') time += step * dir;
    else if (e.key === 'ArrowLeft') time -= step * dir;
    else return;
    video.currentTime = ((time % video.duration) + video.duration) % video.duration;
  }

  /* ---------- NEWSLETTER ---------- */
  protected subscribe(e: Event): void {
    e.preventDefault();
    if (!this.email()) return;
    this.toast.show(
      this.i18n.isRTL() ? 'شكرًا لك — تم الاشتراك.' : 'Thanks — you are on the list.',
    );
    this.email.set('');
  }
}
