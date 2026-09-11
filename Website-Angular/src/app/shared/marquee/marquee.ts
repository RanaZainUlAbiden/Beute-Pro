import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** How many times [text] repeats inside one track segment. The two
 *  segments must be pixel-identical for the -50% seamless loop below to
 *  have no jump, and each segment must alone be wider than the widest
 *  supported viewport (1920px) or the track runs out of content and a
 *  blank gap shows before it wraps. Five short items rarely clear 1920px
 *  on their own, so the line repeats several times over. */
const REPEATS = 6;

/* =============================================================
   MARQUEE STRIP

   One certification line, scrolling continuously via a pure CSS
   animation — no JS ticker, no layout thrash. The track holds two
   identical segments, each REPEATS copies of [text]; animating
   exactly half the track's width loops with no visible seam or jump,
   because both halves render the same pixels.

   [reverse] flips the scroll direction; RTL flips both directions
   again in styles.scss (html[dir="rtl"] .marquee), so the strip still
   reads the way its language expects.

   Reduced motion is handled globally in styles.scss: the animation
   stops and the duplicate segment is hidden, leaving one static line.
   ============================================================= */
@Component({
  selector: 'app-marquee',
  templateUrl: './marquee.html',
  styleUrl: './marquee.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Marquee {
  /** The single line, already joined with its own separators (e.g. " · "). */
  readonly text = input.required<string>();
  readonly reverse = input(false);

  /** One long, repeated line — the actual content of a track segment. */
  protected readonly segment = computed(() => {
    const line = this.text();
    return `${Array.from({ length: REPEATS }, () => line).join(' · ')} · `;
  });
}
