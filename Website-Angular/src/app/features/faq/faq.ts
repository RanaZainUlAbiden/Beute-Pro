import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AccordionPanelDirective } from '../../core/directives/accordion-panel.directive';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { I18nService } from '../../core/services/i18n.service';
import { SplitHeading, type SplitSegment } from '../../shared/split-heading/split-heading';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, AccordionPanelDirective, SplitHeading],
})
export class Faq {
  protected readonly i18n = inject(I18nService);

  protected readonly heroTitle = computed<SplitSegment[]>(() => [
    { text: this.i18n.t('faq.t1') },
    { text: this.i18n.t('faq.t2'), class: 'accent' },
  ]);

  /** Six questions; the first one starts open. */
  protected readonly panels = signal<readonly boolean[]>([
    true,
    false,
    false,
    false,
    false,
    false,
  ]);

  protected readonly heroEmpty = signal(false);

  protected toggle(i: number): void {
    this.panels.update((open) => open.map((v, n) => (n === i ? !v : v)));
  }
}
