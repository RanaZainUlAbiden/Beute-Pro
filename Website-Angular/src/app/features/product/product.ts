import { isPlatformBrowser } from '@angular/common';
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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap, map, catchError } from 'rxjs';

import { AccordionPanelDirective } from '../../core/directives/accordion-panel.directive';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { StaggerDirective } from '../../core/directives/stagger.directive';
import { imgSrc, spinSrc } from '../../core/image';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';
import { MotionService } from '../../core/services/motion.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { WishlistService } from '../../services/wishlist';
import { ApiProduct, ApiCategory } from '../../core/models/api.model';
import { ProductCard } from '../../shared/product-card/product-card';
import { SplitHeading } from '../../shared/split-heading/split-heading';

type Tab = 'photos' | 'spin';
type HintKey = 'pdp.zoomhint' | 'pdp.taphint' | 'pdp.panhint';

/** Photos are probed once per product and cached for the session. */
const photoCache = new Map<string, Promise<number[]>>();

@Component({
  selector: 'app-product',
  templateUrl: './product.html',
  styleUrl: './product.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ImgFallbackDirective,
    StaggerDirective,
    AccordionPanelDirective,
    ProductCard,
    SplitHeading,
  ],
})
export class ProductPage implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly wishlist = inject(WishlistService);
  protected readonly i18n = inject(I18nService);
  protected readonly cart = inject(CartService);
  private readonly motion = inject(MotionService);

  protected readonly imgSrc = imgSrc;

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  // ✅ Live product from API
  protected readonly product = signal<ApiProduct | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly notFound = signal(false);

  // Categories cache for the crumb / label
  protected readonly categories = signal<ApiCategory[]>([]);
  protected readonly related = signal<ApiProduct[]>([]);

  protected readonly inWishlist = signal(false);

  protected readonly copy = computed(() => {
    const p = this.product();
    return p ? this.i18n.copy(p as any) : null;
  });

  protected readonly categoryName = computed(() => {
    const p = this.product();
    if (!p) return '';
    const cat = this.categories().find((c) => c.id === p.category);
    return cat ? this.i18n.catName(cat) : p.category;
  });

  /* ---------- viewer ---------- */
  protected readonly tab = signal<Tab>('photos');
  protected readonly activeImg = signal(1);
  protected readonly photos = signal<number[]>([1]);
  protected readonly spinReady = signal(false);
  protected readonly spinDragging = signal(false);
  protected readonly hintKey = signal<HintKey>('pdp.zoomhint');
  protected readonly zooming = signal(false);
  protected readonly pinned = signal(false);

  private readonly zoomBox = viewChild.required<ElementRef<HTMLElement>>('zoomBox');
  private readonly zoomImg = viewChild.required<ElementRef<HTMLImageElement>>('zoomImg');
  private readonly zoomLens = viewChild.required<ElementRef<HTMLElement>>('zoomLens');
  private readonly zoomPane = viewChild.required<ElementRef<HTMLElement>>('zoomPane');
  private readonly spinBox = viewChild<ElementRef<HTMLElement>>('spinBox');
  private readonly spinVideo = viewChild<ElementRef<HTMLVideoElement>>('spinVideo');

  /* ---------- buy box ---------- */
  protected readonly qty = signal(1);
  protected readonly panels = signal<readonly boolean[]>([true, false, false]);

  private spinIo: IntersectionObserver | undefined;
  private probedSpinFor: string | null = null;
  private sx = 0;
  private sy = 0;
  private dragAxis: 'x' | 'y' | null = null;
  private startTime = 0;
  private resumeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Load categories once for label lookup
    this.categoryService.list().subscribe({
      next: (res) => this.categories.set(res.categories),
      error: () => { /* non-blocking */ },
    });

    // Fetch product whenever the route ID changes
    effect(() => {
      const id = this.params().get('id');
      if (!id) {
        this.notFound.set(true);
        this.isLoading.set(false);
        return;
      }
      this.loadProduct(id);
    });

    // Wishlist state for the current product
    effect(() => {
      const id = this.product()?.id;
      if (id) this.inWishlist.set(this.wishlist.isInWishlist(id));
    });

    // Reset viewer when a new product loads
    effect(() => {
      const p = this.product();
      if (!p) return;
      this.activeImg.set(1);
      this.tab.set('photos');
      this.photos.set([1]);
      this.spinReady.set(false);
      if (!this.isBrowser) return;
      void this.probePhotos(p.id).then((list) => {
        if (p.id === this.product()?.id) this.photos.set(list);
      });
      this.loadRelated(p);
    });

    // 360 probe needs the <video> element, so it waits for a render
    afterRenderEffect(() => {
      const p = this.product();
      if (p && p.id !== this.probedSpinFor) {
        this.probedSpinFor = p.id;
        this.initSpin(p.id);
      }
    });

    afterNextRender(() => {
      this.initTouchZoom();
      this.zone.runOutsideAngular(() => {
        addEventListener('mousemove', this.onWindowMove);
        addEventListener('mouseup', this.onWindowUp);
        addEventListener('touchend', this.onWindowUp);
      });
    });
  }

  private loadProduct(id: string): void {
    this.isLoading.set(true);
    this.notFound.set(false);
    this.productService.getById(id).subscribe({
      next: (res) => {
        this.product.set(res.product);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load product', err);
        this.notFound.set(true);
        this.isLoading.set(false);
      },
    });
  }

  private loadRelated(current: ApiProduct): void {
    this.productService.list({ category: current.category, limit: 8 }).subscribe({
      next: (res) => {
        const related = res.products
          .filter((p) => p.id !== current.id)
          .slice(0, 4);
        this.related.set(related);
      },
      error: () => this.related.set([]),
    });
  }

  protected toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    const id = p.id;
    if (this.inWishlist()) {
      this.wishlist.remove(id).subscribe({
        next: () => this.inWishlist.set(false),
        error: (err) => console.error('Failed to remove from wishlist', err),
      });
    } else {
      this.wishlist.add(id).subscribe({
        next: () => this.inWishlist.set(true),
        error: (err) => console.error('Failed to add to wishlist', err),
      });
    }
  }

  private readonly onWindowMove = (e: MouseEvent) => this.spinMove(e);
  private readonly onWindowUp = () => this.spinEnd();

  ngOnDestroy(): void {
    this.spinIo?.disconnect();
    clearTimeout(this.resumeTimer);
    if (!this.isBrowser) return;
    removeEventListener('mousemove', this.onWindowMove);
    removeEventListener('mouseup', this.onWindowUp);
    removeEventListener('touchend', this.onWindowUp);
  }

  /* ---------- PHOTOS ---------- */
  private probePhotos(id: string): Promise<number[]> {
    const hit = photoCache.get(id);
    if (hit) return hit;
    const test = (n: number) =>
      new Promise<boolean>((res) => {
        const im = new Image();
        im.onload = () => res(true);
        im.onerror = () => res(false);
        im.src = imgSrc(id, n);
      });
    const run = Promise.all([1, 2, 3, 4, 5].map(test)).then((flags) => {
      const out: number[] = [];
      for (const ok of flags) {
        if (!ok) break;
        out.push(out.length + 1);
      }
      return out.length ? out : [1];
    });
    photoCache.set(id, run);
    return run;
  }

  protected pickPhoto(n: number): void {
    this.activeImg.set(n);
    this.zoomOut();
  }

  /* ---------- HOVER MAGNIFIER ---------- */
  private contentRect(): { left: number; top: number; width: number; height: number } {
    const img = this.zoomImg().nativeElement;
    const r = img.getBoundingClientRect();
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return r;
    const s = Math.min(r.width / nw, r.height / nh);
    const w = nw * s;
    const h = nh * s;
    return {
      left: r.left + (r.width - w) / 2,
      top: r.top + (r.height - h) / 2,
      width: w,
      height: h,
    };
  }

  protected zoomMove(e: MouseEvent): void {
    const ir = this.contentRect();
    if (
      e.clientX < ir.left ||
      e.clientX > ir.left + ir.width ||
      e.clientY < ir.top ||
      e.clientY > ir.top + ir.height
    ) {
      this.zoomLeave();
      return;
    }
    this.zooming.set(true);
    if (innerWidth <= 1024) return;

    const lens = this.zoomLens().nativeElement;
    const pane = this.zoomPane().nativeElement;
    const box = this.zoomBox().nativeElement;
    const lw = lens.offsetWidth;
    const lh = lens.offsetHeight;
    const factor = pane.offsetWidth / lw;

    let x = e.clientX - ir.left - lw / 2;
    let y = e.clientY - ir.top - lh / 2;
    x = Math.max(0, Math.min(x, ir.width - lw));
    y = Math.max(0, Math.min(y, ir.height - lh));

    const br = box.getBoundingClientRect();
    lens.style.left = `${ir.left - br.left + x}px`;
    lens.style.top = `${ir.top - br.top + y}px`;

    const img = this.zoomImg().nativeElement;
    pane.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    pane.style.backgroundSize = `${ir.width * factor}px ${ir.height * factor}px`;
    pane.style.backgroundPosition = `-${x * factor}px -${y * factor}px`;
  }

  protected zoomLeave(): void {
    if (this.pinned()) return;
    this.zooming.set(false);
  }

  /* ---------- TOUCH ZOOM ---------- */
  private touch = false;
  private tsx = 0;
  private tsy = 0;
  private moved = 0;
  private t0 = 0;

  private initTouchZoom(): void {
    this.touch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
    if (this.touch) this.hintKey.set('pdp.taphint');
  }

  private originAt(cx: number, cy: number): void {
    const r = this.contentRect();
    const x = Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((cy - r.top) / r.height) * 100));
    this.zoomImg().nativeElement.style.transformOrigin = `${x}% ${y}%`;
  }

  protected zoomTouchStart(e: TouchEvent): void {
    const p = e.touches[0];
    this.tsx = p.clientX;
    this.tsy = p.clientY;
    this.moved = 0;
    this.t0 = Date.now();
  }

  protected zoomTouchMove(e: TouchEvent): void {
    const p = e.touches[0];
    this.moved = Math.max(this.moved, Math.hypot(p.clientX - this.tsx, p.clientY - this.tsy));
    if (!this.pinned()) return;
    e.preventDefault();
    this.originAt(p.clientX, p.clientY);
  }

  protected zoomTouchEnd(e: TouchEvent): void {
    const quick = Date.now() - this.t0 < 350;
    if (this.moved > 12 || !quick) return;
    const p = e.changedTouches[0];
    if (this.pinned()) this.zoomOut();
    else this.zoomIn(p.clientX, p.clientY);
  }

  private zoomIn(cx: number, cy: number): void {
    this.originAt(cx, cy);
    this.pinned.set(true);
    this.zooming.set(true);
    this.hintKey.set('pdp.panhint');
  }

  private zoomOut(): void {
    if (!this.pinned() && !this.zooming()) return;
    this.pinned.set(false);
    this.zooming.set(false);
    this.zoomImg().nativeElement.style.transformOrigin = '';
    if (this.touch) this.hintKey.set('pdp.taphint');
  }

  /* ---------- 360 VIEWER ---------- */
  private initSpin(id: string): void {
    const video = this.spinVideo()?.nativeElement;
    const box = this.spinBox()?.nativeElement;
    if (!video || !box) return;

    const ok = this.product()?.spin ?? false;
    this.spinReady.set(ok);
    if (!ok) return;

    video.poster = imgSrc(id, 1);
    video.muted = true;
    if (this.motion.reduced) video.removeAttribute('autoplay');
    video.src = spinSrc(id);
    video.load();

    if (this.motion.reduced) return;

    this.spinIo?.disconnect();
    this.spinIo = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.tab() === 'spin') this.spinPlay();
        else video.pause();
      },
      { threshold: 0.3 },
    );
    this.spinIo.observe(box);
  }

  private spinPlay(): void {
    if (this.spinDragging()) return;
    this.spinVideo()?.nativeElement.play().catch(() => { /* poster stands in */ });
  }

  protected setTab(tab: Tab): void {
    this.tab.set(tab);
    this.zoomOut();
    this.onTabChange();
  }

  private onTabChange(): void {
    if (!this.spinReady()) return;
    const video = this.spinVideo()?.nativeElement;
    if (this.tab() === 'spin' && !this.motion.reduced) this.spinPlay();
    else video?.pause();
  }

  protected spinStart(e: MouseEvent | TouchEvent): void {
    const video = this.spinVideo()?.nativeElement;
    if (!video) return;
    const p = 'touches' in e ? e.touches[0] : e;
    this.sx = p.clientX;
    this.sy = p.clientY;
    this.dragAxis = null;
    this.startTime = video.currentTime || 0;
    this.spinDragging.set(true);
    video.pause();
  }

  protected spinMove(e: MouseEvent | TouchEvent): void {
    if (!this.spinDragging()) return;
    const video = this.spinVideo()?.nativeElement;
    const p = 'touches' in e ? e.touches[0] : e;
    const dx = p.clientX - this.sx;
    const dy = p.clientY - this.sy;
    if (this.dragAxis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      this.dragAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (this.dragAxis === 'y') return this.spinEnd();
    }
    if (this.dragAxis !== 'x' || !video?.duration) return;
    e.preventDefault();
    this.spinScrub(p.clientX);
  }

  protected spinEnd(): void {
    if (!this.spinDragging()) return;
    this.spinDragging.set(false);
    this.onTabChange();
  }

  private spinScrub(clientX: number): void {
    const video = this.spinVideo()?.nativeElement;
    const box = this.spinBox()?.nativeElement;
    if (!video?.duration || !box) return;
    const rect = box.getBoundingClientRect();
    const dir = this.i18n.isRTL() ? -1 : 1;
    const t = this.startTime + ((clientX - this.sx) / rect.width) * video.duration * dir;
    video.currentTime = ((t % video.duration) + video.duration) % video.duration;
  }

  protected spinKeydown(e: KeyboardEvent): void {
    const video = this.spinVideo()?.nativeElement;
    if (!video?.duration) return;
    const dir = this.i18n.isRTL() ? -1 : 1;
    const step = video.duration / 24;
    if (e.key === 'ArrowRight') this.nudge(step * dir);
    else if (e.key === 'ArrowLeft') this.nudge(-step * dir);
  }

  private nudge(delta: number): void {
    const video = this.spinVideo()?.nativeElement;
    if (!video?.duration) return;
    video.pause();
    const t = video.currentTime + delta;
    video.currentTime = ((t % video.duration) + video.duration) % video.duration;
    clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => this.onTabChange(), 650);
  }

  /* ---------- BUY BOX ---------- */
  protected stepQty(delta: number): void {
    this.qty.update((q) => Math.max(1, Math.min(99, q + delta)));
  }

  protected addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cart.add(p.id, this.qty());
  }

  protected togglePanel(i: number): void {
    this.panels.update((open) => open.map((v, n) => (n === i ? !v : v)));
  }
}