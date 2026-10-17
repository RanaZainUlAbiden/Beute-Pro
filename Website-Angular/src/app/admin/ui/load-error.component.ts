import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { I18nService } from '../../core/services/i18n.service';

/* =============================================================
   LOAD ERROR (admin)

   The counterpart to <app-loading-spinner>: what a screen shows
   when a read FAILED, as opposed to when it returned nothing.

   The distinction is the whole point. A failed read used to fall
   through to the empty state, so "0 categories" meant either an
   empty database or a dead API — and an admin could not tell
   which. Acting on that false baseline is the real danger (the
   settings form let Save overwrite real values with placeholder
   ones), so every screen that reads now renders this instead of
   its empty state when the read fails.

   Retry is a button, never a timer: an automatic retry loop
   hammers an API that is already struggling, and the admin never
   finds out anything is wrong.
   ============================================================= */
@Component({
  selector: 'app-load-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="load-error" role="alert">
      <div class="load-error__icon">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none" />
          <path
            d="M12 7.5v5.5M12 16.2v.3"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            fill="none"
          />
        </svg>
      </div>

      <p class="load-error__title">{{ title }}</p>
      <p class="load-error__body">{{ i18n.t('admin.common.apiDown') }}</p>

      <!-- The server's own words, when it managed to say any. Kept
           small and selectable: it is for the admin to paste to us,
           not the headline. -->
      <p class="load-error__detail" *ngIf="detail">{{ detail }}</p>

      <button type="button" class="btn btn--gold" (click)="retry.emit()" [disabled]="busy">
        {{ busy ? i18n.t('admin.common.retrying') : i18n.t('admin.common.tryAgain') }}
      </button>
    </div>
  `,
  styles: [
    `
      .load-error {
        background: var(--white, #fff);
        border-radius: var(--r-lg, 18px);
        border-left: 3px solid #a8443c;
        padding: 2.5rem 1.5rem;
        text-align: center;
        color: var(--green-soft, #5c7a68);
      }
      .load-error__icon {
        color: #a8443c;
        margin-bottom: 0.6rem;
      }
      .load-error__title {
        margin: 0 0 0.4rem;
        font-size: 1rem;
        font-weight: 600;
        color: var(--green, #0f2a1d);
      }
      .load-error__body {
        margin: 0 0 0.75rem;
        font-size: 0.9rem;
        max-width: 46ch;
        margin-inline: auto;
      }
      .load-error__detail {
        margin: 0 0 1rem;
        font-size: 0.8rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #a8443c;
        background: rgba(168, 68, 60, 0.08);
        border-radius: var(--r, 8px);
        padding: 0.5rem 0.75rem;
        max-width: 60ch;
        margin-inline: auto;
        overflow-wrap: anywhere;
        /* The server speaks English (and URLs); don't let RTL reorder it. */
        direction: ltr;
        text-align: start;
      }
    `,
  ],
})
export class LoadErrorComponent {
  protected readonly i18n = inject(I18nService);

  /** Already-translated headline, e.g. i18n.t('admin.categories.loadErrTitle'). */
  @Input() title = '';

  /** The API's own message, when there was one. Optional by design. */
  @Input() detail = '';

  /** True while a retry is in flight, so the button can't be double-fired. */
  @Input() busy = false;

  @Output() retry = new EventEmitter<void>();
}
