import {
  Directive,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  inject,
  input,
} from '@angular/core';

import { MotionService } from '../services/motion.service';

/* =============================================================
   A container whose children arrive one after another.

   Same 85ms step, capped at the ninth child, that motion.js used.
   `staggerKey` stands in for main.js's Motion.reset(box): change it
   when the container's contents are replaced (a shop filter, say)
   and the row re-arms and plays again.
   ============================================================= */
@Directive({ selector: '.stagger' })
export class StaggerDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  readonly staggerKey = input<unknown>(null);

  private armed = false;

  constructor() {
    afterNextRender(() => {
      this.delays();
      this.motion.observe(this.el);
      this.armed = true;
    });

    afterRenderEffect(() => {
      this.staggerKey();
      if (!this.armed) return; // first pass is afterNextRender's
      this.delays();
      this.motion.reset(this.el);
    });
  }

  private delays(): void {
    Array.from(this.el.children).forEach((child, i) => {
      (child as HTMLElement).style.transitionDelay = `${Math.min(i, 8) * 85}ms`;
    });
  }
}
