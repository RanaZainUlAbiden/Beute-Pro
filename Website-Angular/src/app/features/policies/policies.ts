import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../core/services/i18n.service';
import { SplitHeading, type SplitSegment } from '../../shared/split-heading/split-heading';

@Component({
  selector: 'app-policies',
  templateUrl: './policies.html',
  styleUrl: './policies.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SplitHeading],
})
export class Policies {
  protected readonly i18n = inject(I18nService);

  protected readonly heroTitle = computed<SplitSegment[]>(() => [
    { text: this.i18n.t('policies.t1') },
    { text: this.i18n.t('policies.t2'), class: 'accent' },
  ]);

  protected readonly heroEmpty = signal(false);
}
