import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RevealDirective } from '../../core/directives/reveal.directive';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../core/services/toast.service';
import { SplitHeading, type SplitSegment } from '../../shared/split-heading/split-heading';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, SplitHeading],
})
export class Contact {
  protected readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  protected readonly heroTitle = computed<SplitSegment[]>(() => [
    { text: this.i18n.t('contact.t1') },
    { text: this.i18n.t('contact.t2'), class: 'accent' },
  ]);

  protected readonly heroEmpty = signal(false);

  /* No backend: the form confirms and clears, exactly as it did. */
  protected send(e: Event): void {
    e.preventDefault();
    this.toast.show(this.i18n.t('contact.toast'));
    (e.target as HTMLFormElement).reset();
  }
}
