import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { I18nService } from '../../core/services/i18n.service';
import { VideoService } from '../../core/services/video.service';

/* =============================================================
   VIDEO FIGURE — a click-to-play clip with a caption

   One component behind every real-footage clip on the site: the
   three on the homepage's Our Floor band and the two on Our Story.

   Nothing downloads until the visitor asks for it. With a poster
   image the element is preload="none" and costs a single image;
   without one it drops to preload="metadata" — the header only,
   a few tens of KB — and the `#t=0.1` fragment makes the browser
   paint the frame at a tenth of a second as the still. That is
   per element, so a clip that gains a poster file later goes back
   to preload="none" with no code change.

   The overlay is a real <button> filling the poster, which is
   what makes the whole thing work with a keyboard: it takes tab
   focus, Enter and Space both fire click natively, and the gold
   focus ring is drawn inset so the band's overflow cannot clip
   it. Once it has started, the native controls take over.

   Reduced motion needs nothing switched off here — there is no
   autoplay, no hover preview and no scrubbing. A poster and a
   play button is all the component ever does on its own.
   ============================================================= */
@Component({
  selector: 'app-video-figure',
  templateUrl: './video-figure.html',
  styleUrl: './video-figure.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoFigure implements OnDestroy {
  /** Root-absolute path, e.g. /assets/video/factory/outside-view.mp4 */
  readonly src = input.required<string>();
  /** Visible, translated caption naming what the clip shows. */
  readonly caption = input.required<string>();
  /** Poster image, when one exists on disk. */
  readonly poster = input<string | null>(null);

  protected readonly i18n = inject(I18nService);
  private readonly videos = inject(VideoService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');

  /** Flips once, on the first play; the native controls stay after that. */
  protected readonly started = signal(false);

  protected readonly mediaSrc = computed(() =>
    this.poster() ? this.src() : `${this.src()}#t=0.1`,
  );
  protected readonly preload = computed(() => (this.poster() ? 'none' : 'metadata'));
  protected readonly playLabel = computed(
    () => `${this.i18n.t('video.play')}: ${this.caption()}`,
  );

  constructor() {
    afterNextRender(() => {
      const v = this.videoRef()?.nativeElement;
      if (v) this.videos.watch(v);
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    const v = this.videoRef()?.nativeElement;
    if (v) this.videos.unwatch(v);
  }

  /** Click, Enter or Space on the overlay — all one <button> activation. */
  protected start(): void {
    const v = this.videoRef()?.nativeElement;
    if (!v) return;
    this.started.set(true);
    v.muted = true; // the `muted` attribute alone doesn't always take before playback
    v.preload = 'auto';
    v.play().catch(() => this.started.set(false)); // blocked: keep the poster
  }

  /* The site is silent by design — the native controls stay (for play,
     pause and scrub) but their volume slider is a dead end: any attempt
     to unmute snaps straight back. */
  protected onVolumeChange(): void {
    const v = this.videoRef()?.nativeElement;
    if (v && !v.muted) v.muted = true;
  }

  protected onPlay(): void {
    const v = this.videoRef()?.nativeElement;
    if (v) this.videos.claim(v);
  }

  protected onPause(): void {
    const v = this.videoRef()?.nativeElement;
    if (v) this.videos.released(v);
  }
}
