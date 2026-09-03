import {
  Directive,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  input,
} from '@angular/core';

import { MotionService } from '../services/motion.service';

/* =============================================================
   NUMBER COUNTERS

   Ported from motion.js. Nothing in the current markup uses it —
   the homepage's three figures were made static in the redesign —
   but it is kept so `[data-count]` still works if a number is
   added back.
   ============================================================= */
@Directive({ selector: '[data-count]' })
export class CountUpDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  /** The number to count to. */
  readonly target = input.required<number>({ alias: 'data-count' });
  /** Any value pads to two digits, e.g. 08. */
  readonly pad = input(false, { alias: 'data-count-pad' });

  private io: IntersectionObserver | undefined;

  constructor() {
    afterNextRender(() => this.arm());
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }

  private arm(): void {
    const target = this.target();
    if (Number.isNaN(target)) return;
    this.el.classList.add('counted');

    if (this.motion.reduced) {
      this.el.textContent = this.format(target);
      return;
    }

    this.io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        this.run(target);
        this.io?.disconnect();
      },
      { threshold: 0.4 },
    );
    this.io.observe(this.el);
  }

  private run(target: number): void {
    const dur = 1500;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      this.el.textContent = this.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private format(v: number): string {
    return this.pad() ? String(v).padStart(2, '0') : String(v);
  }
}
