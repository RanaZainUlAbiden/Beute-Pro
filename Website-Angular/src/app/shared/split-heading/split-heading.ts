import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { MotionService } from '../../core/services/motion.service';

/** One run of text inside a heading, optionally in its own span. */
export interface SplitSegment {
  text: string;
  /** Class for the wrapping span, e.g. 'accent'. */
  class?: string;
}

interface Word {
  text: string;
  delay: number;
}

interface Row {
  /** Wrapped in its own span, as the two-part headings are. */
  wrap: boolean;
  class: string;
  words: Word[];
}

/* =============================================================
   WORD-BY-WORD HEADLINES

   Each word gets an overflow box so it can slide up from behind
   the line above it. Works in Arabic too.

   motion.js did this by walking the DOM and replacing text nodes.
   Here the words are part of the template, so a language change
   re-renders them instead of needing a re-split — and the server
   sends the real words, which is what search engines read.

   The `.split` class is added only after the first browser render,
   exactly as splitHeadings() did: before that (and always, under
   reduced motion) the words are unstyled inline spans and the
   heading reads as ordinary text.
   ============================================================= */
@Component({
  selector: '[splitHeading]',
  templateUrl: './split-heading.html',
  styleUrl: './split-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.split]': 'active()',
    // A returning Arabic visitor boots in Arabic while the server sent
    // English, and Arabic splits into a different number of words — a
    // structural hydration mismatch. This heading is cheap to rebuild,
    // so it is re-rendered on the client rather than claimed.
    ngSkipHydration: 'true',
  },
})
export class SplitHeading {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  /** A heading that is one bare run of text, with no wrapping span. */
  readonly text = input<string | null>(null);
  /** A heading built from several spans, e.g. a plain half and an .accent half. */
  readonly segments = input<readonly SplitSegment[] | null>(null);

  protected readonly active = signal(false);

  protected readonly rows = computed<Row[]>(() => {
    const segments = this.segments();
    const source: SplitSegment[] = segments
      ? [...segments]
      : [{ text: this.text() ?? '' }];

    let i = 0;
    return source.map((seg) => ({
      wrap: segments !== null,
      class: seg.class ?? '',
      words: seg.text
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({ text: word, delay: Math.min(i++, 14) * 55 })),
    }));
  });

  constructor() {
    afterNextRender(() => {
      if (this.motion.reduced) return; // no split at all, as in motion.js
      this.active.set(true);
      this.motion.observe(this.el);
    });
  }
}
