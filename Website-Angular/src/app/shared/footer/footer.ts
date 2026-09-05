import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { CATEGORIES } from '../../core/data/products';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ImgFallbackDirective],
})
export class Footer {
  protected readonly i18n = inject(I18nService);
  protected readonly categories = CATEGORIES;

  /** logo-white.png, then the wordmark. */
  protected readonly logoFailed = signal(false);
}
