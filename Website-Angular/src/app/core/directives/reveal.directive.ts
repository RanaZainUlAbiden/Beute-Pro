import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

import { MotionService } from '../services/motion.service';

/* Fade/slide up once, in view. Matched by class so the markup reads
   exactly as it did in the static site, and driven by the one shared
   observer in MotionService. */
@Directive({ selector: '.reveal, .reveal-mask' })
export class RevealDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  constructor() {
    afterNextRender(() => this.motion.observe(this.el));
  }
}
