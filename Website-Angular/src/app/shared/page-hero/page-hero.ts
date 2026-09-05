import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { NgOptimizedImage } from '@angular/common';

import { MotionService } from '../../core/services/motion.service';
import { SplitHeading, type SplitSegment } from '../split-heading/split-heading';

/* =============================================================
   FULL-VIEWPORT PAGE HERO

   One hero for home, shop and contact. They were three near-copies
   of the same block: a full-bleed media layer, the scrim (mirrored
   in Arabic), and a copy column sitting clear of the fixed header.
   The differences are all data, so they are inputs:

     [video] + [poster]   home — the looping clip
     [image]              shop / contact — a still
     [focus]              object-position, when the subject is not
                          in the middle of the frame
     [heading]            a plain one-line headline
     [segments]           a headline split into spans (the two-tone
                          shop/contact headings), animated word by
                          word by SplitHeading

   Anything a single page needs on its own — a breadcrumb above the
   eyebrow, buttons under the copy — is projected: `[heroTop]` lands
   above the eyebrow, everything else below the lede.

   The media never blocks the page: if the file 404s or the clip
   cannot play, `empty` flips and the gradient behind it shows
   instead, which is what the old per-page `heroEmpty` did.
   ============================================================= */
@Component({
  selector: 'app-page-hero',
  templateUrl: './page-hero.html',
  styleUrl: './page-hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitHeading, NgOptimizedImage],
})
export class PageHero {
  private readonly motion = inject(MotionService);

  /** Still image behind the copy, e.g. `/assets/img/shop.jpg`. */
  readonly image = input<string | null>(null);
  /** Same still as WebP, tried first via a <picture> <source>. */
  protected readonly webpImage = computed(() => {
    const src = this.image();
    return src ? src.replace(/\.(?:jpe?g|png)$/i, '.webp') : null;
  });
  /** Intrinsic size of [image] — every current still is 1376×768. */
  readonly imageWidth = input<number>(1376);
  readonly imageHeight = input<number>(768);
  /** Looping clip behind the copy. Takes precedence over [image]. */
  readonly video = input<string | null>(null);
  /** First frame for [video], shown until it plays and under reduced motion. */
  readonly poster = input<string | null>(null);
  /** `object-position` for the media — where the subject sits in the frame. */
  readonly focus = input<string>('center 30%');

  readonly sectionId = input<string | null>(null);
  readonly eyebrow = input<string | null>(null);
  /** A bare headline. Ignored when [segments] is given. */
  readonly heading = input<string | null>(null);
  /** A headline built from several spans, e.g. a plain half and an .accent half. */
  readonly segments = input<readonly SplitSegment[] | null>(null);
  readonly copy = input<string | null>(null);
  /** Alt text for [image]; empty by default — the hero is decorative. */
  readonly alt = input('');

  /** The media failed or is missing: fall through to the gradient. */
  protected readonly empty = signal(false);

  private readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

  constructor() {
    afterNextRender(() => this.initVideo());
  }

  private initVideo(): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;

    video.muted = true; // the `muted` attribute alone doesn't always take before playback
    const fallback = () => this.empty.set(true);
    // capture, because a <source> element's error does not bubble
    video.addEventListener('error', fallback, true);

    if (this.motion.reduced) {
      video.removeAttribute('autoplay');
      video.pause(); // the poster frame is all a reduced-motion visitor gets
    } else {
      video.play()?.catch(fallback);
    }
  }
}
