import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RevealDirective } from '../../core/directives/reveal.directive';
import { StaggerDirective } from '../../core/directives/stagger.directive';
import { I18nService } from '../../core/services/i18n.service';
import { SplitHeading, type SplitSegment } from '../../shared/split-heading/split-heading';
import { VideoFigure } from '../../shared/video-figure/video-figure';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, StaggerDirective, SplitHeading, VideoFigure],
})
export class About {
  protected readonly i18n = inject(I18nService);

  /** The nine things we don't compromise on. */
  protected readonly badges = [
    'about.b1',
    'about.b2',
    'about.b3',
    'about.b4',
    'about.b5',
    'about.b6',
    'about.b7',
    'about.b8',
    'about.b9',
  ] as const;

  protected readonly whyTitle = computed<SplitSegment[]>(() => [
    { text: this.i18n.t('why.title') },
  ]);

  protected readonly heroEmpty = signal(false);
}
