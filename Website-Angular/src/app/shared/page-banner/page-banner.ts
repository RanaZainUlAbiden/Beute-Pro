import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

import { SplitHeading, type SplitSegment } from '../split-heading/split-heading';

/* =============================================================
   COMPACT PAGE BANNER

   The dark band at the top of the inner pages — about, FAQ and
   policies. It was the same twenty lines of markup copied into
   three templates, byte for byte apart from the photo, the crumb
   and the three strings, so the copies are gone and the data are
   inputs. Its companion is app-page-hero, the full-viewport hero
   the home, shop and contact pages open with; this is the short
   one, for routes that sit below the fixed header rather than
   under it.

   The crumb goes in through `[bannerTop]`, above the eyebrow;
   anything else projected lands below the lede.

   The photo never blocks the page. A missing or broken file — and
   two of the three were pointing at files that do not exist —
   flips `empty` and the gradient behind it shows instead, which is
   what each page's own `heroEmpty` signal used to do.
   ============================================================= */
@Component({
  selector: 'app-page-banner',
  templateUrl: './page-banner.html',
  styleUrl: './page-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitHeading, NgOptimizedImage],
})
export class PageBanner {
  /** Photo behind the copy. Omit it for the gradient on its own. */
  readonly image = input<string | null>(null);
  /** Same photo as WebP, tried first via a <picture> <source>. */
  protected readonly webpImage = computed(() => {
    const src = this.image();
    return src ? src.replace(/\.(?:jpe?g|png)$/i, '.webp') : null;
  });
  /** Intrinsic size of [image] — most banner photos are 1920×800. */
  readonly imageWidth = input<number>(1920);
  readonly imageHeight = input<number>(800);
  /** Alt text for [image]; empty by default — the banner is decorative. */
  readonly alt = input('');
  readonly eyebrow = input<string | null>(null);
  /** A bare headline. Ignored when [segments] is given. */
  readonly heading = input<string | null>(null);
  /** A headline built from several spans, e.g. a plain half and an .accent half. */
  readonly segments = input<readonly SplitSegment[] | null>(null);
  readonly copy = input<string | null>(null);

  /** The photo 404'd or errored. */
  private readonly failed = signal(false);

  /** No photo asked for, or the one asked for did not load. */
  protected readonly empty = computed(() => this.failed() || !this.image());

  protected onError(): void {
    this.failed.set(true);
  }
}
