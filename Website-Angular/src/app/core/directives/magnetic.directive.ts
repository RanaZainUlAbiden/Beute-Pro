import { Directive, ElementRef, inject } from '@angular/core';

import { MotionService } from '../services/motion.service';

/* The button leans toward the cursor. Ported from motion.js; skipped
   entirely under reduced motion and on touch-only pointers. Nothing in
   the current markup carries [data-magnetic], but the hook is kept. */
@Directive({
  selector: '[data-magnetic]',
  host: {
    '(mousemove)': 'onMove($event)',
    '(mouseleave)': 'onLeave()',
  },
})
export class MagneticDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  private raf = 0;

  private get off(): boolean {
    return this.motion.reduced || matchMedia('(hover: none)').matches;
  }

  onMove(e: MouseEvent): void {
    if (this.off) return;
    const r = this.el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.22;
    const y = (e.clientY - r.top - r.height / 2) * 0.3;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => {
      this.el.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  onLeave(): void {
    cancelAnimationFrame(this.raf);
    this.el.style.transform = '';
  }
}
