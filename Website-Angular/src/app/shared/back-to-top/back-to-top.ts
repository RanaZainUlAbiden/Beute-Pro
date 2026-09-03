import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { I18nService } from '../../core/services/i18n.service';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-back-to-top',
  templateUrl: './back-to-top.html',
  styleUrl: './back-to-top.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackToTop {
  private readonly scroll = inject(ScrollService);
  protected readonly i18n = inject(I18nService);

  protected readonly visible = computed(
    () => this.scroll.y() > this.scroll.viewport() * 0.8,
  );

  protected toTop(): void {
    scrollTo({ top: 0, behavior: 'smooth' });
  }
}
