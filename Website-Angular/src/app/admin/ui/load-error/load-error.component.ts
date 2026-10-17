import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-load-error',
  standalone: true,
  templateUrl: './load-error.component.html',
  styleUrl: './load-error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadErrorComponent {
  protected readonly i18n = inject(I18nService);

  /** An omitted or blank title uses the shared, localized default. */
  readonly title = input('');
  readonly detail = input<string | null>(null);
  readonly retrying = input(false);
  readonly retry = output<void>();

  protected readonly heading = computed(
    () => this.title().trim() || this.i18n.t('admin.common.loadFailed'),
  );
}
