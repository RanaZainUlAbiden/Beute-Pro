import { I18nService } from '../../core/services/i18n.service';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-csv-export-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="btn btn--outline btn--sm"
      (click)="clicked.emit()"
      [disabled]="isLoading"
      [attr.aria-label]="label || i18n.t('admin.common.exportCsv')"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" *ngIf="!isLoading">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
              stroke="currentColor" stroke-width="2" fill="none"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="csv-spinner" *ngIf="isLoading"></span>
      <span>{{ isLoading ? i18n.t('admin.common.exporting') : (label || i18n.t('admin.common.exportCsv')) }}</span>
    </button>
  `,
  styles: [`
    .btn--outline {
      border: 1.5px solid var(--green, #0F2A1D);
      color: var(--green, #0F2A1D);
      background: transparent;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1.1rem;
      border-radius: var(--r, 8px);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: background 0.3s, color 0.3s, transform 0.3s;
    }
    .btn--outline:hover:not(:disabled) {
      background: var(--green, #0F2A1D);
      color: var(--ivory, #F7F4EC);
      transform: translateY(-1px);
    }
    .btn--outline:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .csv-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class CsvExportButtonComponent {
  protected readonly i18n = inject(I18nService);
  @Input() label = '';
  @Input() isLoading = false;
  @Output() clicked = new EventEmitter<void>();
}