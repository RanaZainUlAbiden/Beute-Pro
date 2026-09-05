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
import { WishlistService } from '../../services/wishlist';
import { AccordionPanelDirective } from '../../core/directives/accordion-panel.directive';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { StaggerDirective } from '../../core/directives/stagger.directive';
import { CATEGORIES, PRODUCTS } from '../../core/data/products';
import { imgSrc, spinSrc } from '../../core/image';
import type { Product } from '../../core/models/product';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';
import { MotionService } from '../../core/services/motion.service';
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
  private wishlist = inject(WishlistService);
protected inWishlist = signal(false);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);
  protected readonly cart = inject(CartService);
  private readonly motion = inject(MotionService);

  protected readonly imgSrc = imgSrc;

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly product = computed<Product>(
    () => PRODUCTS.find((p) => p.id === this.params().get('id')) ?? PRODUCTS[0],
  );

  protected readonly copy = computed(() => this.i18n.copy(this.product()));

  protected readonly categoryName = computed(() =>
    this.i18n.catName(CATEGORIES.find((c) => c.id === this.product().category)),
  );

  protected readonly related = computed(() => {
    const p = this.product();
    return PRODUCTS.filter((x) => x.id !== p.id)
      .slice()
      .sort(
        (a, b) => Number(b.category === p.category) - Number(a.category === p.category),
      )
      .slice(0, 4);
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
  /** Ingredients / Benefits / How to use. The first one starts open. */
  protected readonly panels = signal<readonly boolean[]>([true, false, false]);

  private spinIo: IntersectionObserver | undefined;
  private probedSpinFor: string | null = null;
  private sx = 0;
  private sy = 0;
  private dragAxis: 'x' | 'y' | null = null;
  private startTime = 0;
  private resumeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // the tab title is the brand name on every page, set from the route —
    // the product name is not appended to it
 effect(() => {
    const id = this.product().id;
    this.inWishlist.set(this.wishlist.isInWishlist(id));
  });
    // a new product resets the viewer and re-probes its photos
    effect(() => {
      const id = this.product().id;
      this.activeImg.set(1);
      this.tab.set('photos');
      this.photos.set([1]);
      this.spinReady.set(false);
      if (!this.isBrowser) return;
      void this.probePhotos(id).then((list) => {
        if (id === this.product().id) this.photos.set(list);
      });
    });

    // the 360° probe needs the <video> element, so it waits for a render
    afterRenderEffect(() => {
      const id = this.product().id;
      if (id !== this.probedSpinFor) {
        this.probedSpinFor = id;
        void this.initSpin(id);
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

  protected toggleWishlist(): void {
  const id = this.product().id;
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

  /* =============================================================
     PHOTOS
     Up to five, <id>-1 … <id>-5. A missing file anywhere in the run
     stops the count there, so a single -1 photo renders as a
     deliberate single frame rather than a rail of broken thumbs.
     ============================================================= */
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

  /* =============================================================
     1. HOVER MAGNIFIER
     Above 1024px a magnified pane opens beside the frame.
     Below that, CSS scales the image inside the frame instead.
     ============================================================= */

  /* object-fit:contain letterboxes the photo inside its box, so work out
     where the picture actually sits before mapping the cursor onto it. */
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

    if (innerWidth <= 1024) return; // small screens use the CSS scale

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

  /* =============================================================
     TOUCH ZOOM
     There is no hover on a phone, so the desktop lens does nothing
     there. Instead: tap the photo and it magnifies around the exact
     point you touched, drag to move around, tap again to exit.
     ============================================================= */
  private touch = false;
  private tsx = 0;
  private tsy = 0;
  private moved = 0;
  private t0 = 0;

  private initTouchZoom(): void {
    this.touch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
    if (this.touch) this.hintKey.set('pdp.taphint');
  }

  /* put the transform origin exactly under the finger, as a percentage
     of the visible picture rather than of its box */
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
    e.preventDefault(); // pan the photo instead of scrolling the page
    this.originAt(p.clientX, p.clientY);
  }

  protected zoomTouchEnd(e: TouchEvent): void {
    const quick = Date.now() - this.t0 < 350;
    if (this.moved > 12 || !quick) return; // that was a drag or a long press
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

  /* =============================================================
     2. THE 360° VIEWER
     A short looping video per product at assets/video/spin/<id>.mp4.
     preload="metadata" doubles as the existence probe — loadedmetadata
     vs error tells us whether to show the tab at all, and only the
     header is fetched until the visitor opens it and it starts playing.
     ============================================================= */
  private async initSpin(id: string): Promise<void> {
    const video = this.spinVideo()?.nativeElement;
    const box = this.spinBox()?.nativeElement;
    if (!video || !box) return;

    video.poster = imgSrc(id, 1);
    if (this.motion.reduced) video.removeAttribute('autoplay'); // poster frame only, ever

    const ok = await new Promise<boolean>((resolve) => {
      const done = (result: boolean) => {
        video.removeEventListener('loadedmetadata', onOk);
        video.removeEventListener('error', onErr);
        resolve(result);
      };
      const onOk = () => done(true);
      const onErr = () => done(false);
      video.addEventListener('loadedmetadata', onOk, { once: true });
      video.addEventListener('error', onErr, { once: true });
      video.src = spinSrc(id);
      video.load();
    });

    if (id !== this.product().id) return; // moved on while probing
    this.spinReady.set(ok);
    if (!ok || this.motion.reduced) return;

    // pause off screen, resume once the tab is open and in view
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
    this.spinVideo()
      ?.nativeElement.play()
      .catch(() => {
        /* autoplay refused; the poster stands in */
      });
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

  /* ---------- drag / scrub ---------- */
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
      if (this.dragAxis === 'y') return this.spinEnd(); // let the page scroll instead
    }
    if (this.dragAxis !== 'x' || !video?.duration) return;
    e.preventDefault(); // scrubbing now, not scrolling
    this.spinScrub(p.clientX);
  }

  protected spinEnd(): void {
    if (!this.spinDragging()) return;
    this.spinDragging.set(false);
    this.onTabChange(); // resumes the loop, if the tab is open and visible
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

  /* =============================================================
     BUY BOX
     ============================================================= */
  protected stepQty(delta: number): void {
    this.qty.update((q) => Math.max(1, Math.min(99, q + delta)));
  }

  protected addToCart(): void {
    this.cart.add(this.product().id, this.qty());
  }

  protected togglePanel(i: number): void {
    this.panels.update((open) => open.map((v, n) => (n === i ? !v : v)));
  }
}
