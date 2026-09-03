import { Directive, ElementRef, effect, inject, input } from '@angular/core';

import { MotionService } from '../services/motion.service';
import { ScrollService } from '../services/scroll.service';

/* Hero media drifts slower than the page. Ported from motion.js;
   no element in the current markup carries [data-parallax], but the
   hook is kept so adding one needs no new wiring. */
@Directive({ selector: '[data-parallax]' })
export class ParallaxDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);

  readonly speed = input(0.2, { alias: 'data-parallax' });

  constructor() {
    effect(() => {
      this.scroll.y();
      if (this.motion.reduced) return;
      const parent = this.el.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      this.el.style.transform = `translate3d(0, ${-rect.top * this.speed()}px, 0)`;
    });
  }
}
