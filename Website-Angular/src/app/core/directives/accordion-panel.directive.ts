import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';

import { I18nService } from '../services/i18n.service';

/* =============================================================
   The max-height accordion used on the product page and the FAQ.

   CSS animates max-height, which cannot transition from 0 to auto,
   so the open height is measured from the content. Re-measured on a
   language change too: Arabic wraps to a different number of lines,
   and a stale max-height would clip it.
   ============================================================= */
@Directive({ selector: '[accordionPanel]' })
export class AccordionPanelDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly i18n = inject(I18nService);

  readonly open = input.required<boolean>({ alias: 'accordionPanel' });

  constructor() {
    afterRenderEffect(() => {
      this.i18n.lang(); // re-measure when the copy changes length
      this.el.style.maxHeight = this.open() ? `${this.el.scrollHeight}px` : '0';
    });
  }
}
