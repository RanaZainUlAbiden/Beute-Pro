import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ScrollService } from '../../core/services/scroll.service';

/* The gold hairline across the top. Shown on every page except the
   homepage, which has none in the static site either. */
@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBar {
  private readonly scroll = inject(ScrollService);

  protected readonly pct = computed(() => {
    const max = this.scroll.max();
    return max > 0 ? (this.scroll.y() / max) * 100 : 0;
  });
}
