import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CurrencyService } from '../../services/currency.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { adminErrorDetail } from '../admin-api';

import { LoadingSpinnerComponent } from '../ui/loading-spinner.component';
import { LoadErrorComponent } from '../ui/load-error.component';

interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const CURRENCY_META: Record<string, CurrencyMeta> = {
  USD: { code: 'USD', name: 'US Dollar',       symbol: '$', flag: '🇺🇸' },
  AED: { code: 'AED', name: 'UAE Dirham',      symbol: 'د.إ', flag: '🇦🇪' },
  GBP: { code: 'GBP', name: 'British Pound',   symbol: '£', flag: '🇬🇧' },
  EUR: { code: 'EUR', name: 'Euro',            symbol: '€', flag: '🇪🇺' },
  SAR: { code: 'SAR', name: 'Saudi Riyal',     symbol: 'ر.س', flag: '🇸🇦' },
};

interface RateRow {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number;         // 1 PKR = rate × <code>
  editing: boolean;
  draftRate: number;
  isSaving: boolean;
  isDirty: boolean;
}

@Component({
  selector: 'app-admin-exchange-rates',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, LoadErrorComponent],
  template: `
    <div class="admin-rates">
      <!-- Header -->
      <div class="page-head">
        <div>
          <h1 class="h-lg">Exchange Rates</h1>
          <p class="page-sub">
            Base currency: <b>PKR</b>
            <span *ngIf="lastUpdated()"> · Last updated {{ lastUpdated() }}</span>
          </p>
        </div>
        <button class="btn btn--gold" (click)="refresh()" [disabled]="isRefreshing() || isLoading() || !!loadError()">
          <svg viewBox="0 0 24 24" width="16" height="16" *ngIf="!isRefreshing()">
            <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" stroke-width="2"
                  fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                  stroke="currentColor" stroke-width="2" fill="none"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span *ngIf="isRefreshing()" class="mini-spinner"></span>
          {{ isRefreshing() ? 'Refreshing…' : 'Refresh from API' }}
        </button>
      </div>

      <!-- Info banner -->
      <div class="info-banner">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8" fill="none"/>
          <path d="M12 8v.01M11 12h1v5h1" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" fill="none"/>
        </svg>
        <span>
          All prices in the store are stored in PKR. These rates are used to display
          converted amounts (USD / AED) to international customers.
        </span>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="isLoading()" message="Loading exchange rates…"></app-loading-spinner>

      <!-- Load failed — shown INSTEAD of the "none configured yet"
           invitation, which was actively misleading: the public API
           returns USD/AED even while this read fails. -->
      <app-load-error
        *ngIf="!isLoading() && loadError()"
        [title]="i18n.t('admin.rates.loadErrTitle')"
        [detail]="loadError()!"
        (retry)="load()"
      ></app-load-error>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!isLoading() && !loadError() && rows().length === 0">
        <p>No exchange rates configured yet. Click <b>Refresh from API</b> to populate them.</p>
      </div>

      <!-- Rate cards -->
      <div class="rate-grid" *ngIf="!isLoading() && !loadError() && rows().length > 0">
        <div class="rate-card" *ngFor="let row of rows(); trackBy: trackByCode"
             [class.is-dirty]="row.isDirty">

          <!-- Top: flag + code + name -->
          <div class="rate-head">
            <span class="flag">{{ row.flag }}</span>
            <div class="rate-code-wrap">
              <span class="rate-code">{{ row.code }}</span>
              <span class="rate-name">{{ row.name }}</span>
            </div>
          </div>

          <!-- Main display -->
          <div class="rate-body">
            <div class="rate-line">
              <span class="base">1 PKR</span>
              <span class="equals">=</span>
              <span class="rate-value">
                <ng-container *ngIf="!row.editing">
                  {{ row.rate | number:'1.4-6' }} {{ row.code }}
                </ng-container>
                <input
                  *ngIf="row.editing"
                  type="number"
                  class="rate-input"
                  [(ngModel)]="row.draftRate"
                  (ngModelChange)="onDraftChange(row, $event)"
                  step="0.0001"
                  min="0"
                />
              </span>
            </div>

            <div class="rate-line rate-line--inverse">
              <span class="inverse-label">Inverse:</span>
              <span class="inverse-value">
                1 {{ row.code }} ≈ {{ inverseRate(row) }} PKR
              </span>
            </div>

            <div class="rate-meta">
              <span class="updated">Updated: {{ formatUpdated(updatedAt()) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="rate-actions">
            <ng-container *ngIf="!row.editing">
              <button class="btn btn--outline btn--sm" (click)="startEdit(row)" [disabled]="row.isSaving">
                Manual override
              </button>
            </ng-container>
            <ng-container *ngIf="row.editing">
              <button class="btn btn--ghost btn--sm" (click)="cancelEdit(row)" [disabled]="row.isSaving">
                Cancel
              </button>
              <button
                class="btn btn--gold btn--sm"
                (click)="saveRow(row)"
                [disabled]="row.isSaving || !row.isDirty"
              >
                {{ row.isSaving ? 'Saving…' : 'Save' }}
              </button>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-rates { padding: 0; }

    .page-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
    }
    .page-head h1 { margin: 0 0 0.25rem; color: var(--green, #0F2A1D); }
    .page-sub { margin: 0; font-size: 0.88rem; color: var(--green-soft, #5C7A68); }
    .page-sub b { color: var(--green, #0F2A1D); }

    /* Info banner */
    .info-banner {
      display: flex; align-items: flex-start; gap: 0.7rem;
      background: rgba(201, 164, 76, 0.08);
      border-left: 3px solid var(--gold, #C9A44C);
      border-radius: var(--r, 8px);
      padding: 0.85rem 1.1rem;
      margin-bottom: 1.5rem;
      color: var(--green, #0F2A1D);
      font-size: 0.85rem;
      line-height: 1.55;
    }
    .info-banner svg { color: var(--gold, #C9A44C); flex-shrink: 0; margin-top: 1px; }

    /* Empty */
    .empty-state {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--green-soft, #5C7A68);
    }
    .empty-state p { margin: 0; font-size: 0.95rem; }

    /* Grid */
    .rate-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.1rem;
    }

    .rate-card {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 1.3rem 1.4rem 1.1rem;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.04);
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      display: flex; flex-direction: column; gap: 1rem;
      transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
    }
    .rate-card:hover {
      border-color: var(--gold, #C9A44C);
      transform: translateY(-2px);
      box-shadow: 0 10px 24px -10px rgba(15, 42, 29, 0.15);
    }
    .rate-card.is-dirty {
      border-color: var(--gold, #C9A44C);
      background: linear-gradient(180deg, rgba(201, 164, 76, 0.05) 0%, #fff 40%);
    }

    /* Head */
    .rate-head {
      display: flex; align-items: center; gap: 0.75rem;
    }
    .flag {
      font-size: 1.8rem;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    .rate-code-wrap { display: flex; flex-direction: column; }
    .rate-code {
      font-size: 1.05rem; font-weight: 800;
      color: var(--green, #0F2A1D);
      letter-spacing: 0.04em;
    }
    .rate-name {
      font-size: 0.76rem;
      color: var(--green-soft, #5C7A68);
    }

    /* Body */
    .rate-body {
      display: flex; flex-direction: column; gap: 0.4rem;
      padding: 0.9rem 0;
      border-top: 1px dashed var(--ivory-3, #E2DBC9);
      border-bottom: 1px dashed var(--ivory-3, #E2DBC9);
    }

    .rate-line {
      display: flex; align-items: baseline; gap: 0.5rem;
      flex-wrap: wrap;
    }
    .rate-line--inverse {
      font-size: 0.76rem;
      padding-top: 0.1rem;
    }

    .base {
      font-size: 0.82rem;
      color: var(--green-soft, #5C7A68);
      font-weight: 600;
    }
    .equals {
      color: var(--green-soft, #5C7A68);
      font-size: 0.82rem;
    }
    .rate-value {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--gold, #C9A44C);
      letter-spacing: -0.01em;
      display: flex; align-items: center;
    }

    .rate-input {
      width: 140px;
      padding: 0.35rem 0.6rem;
      border: 1.5px solid var(--gold, #C9A44C);
      border-radius: var(--r, 8px);
      font-size: 0.95rem;
      font-weight: 700;
      font-family: inherit;
      color: var(--green, #0F2A1D);
      background: #fff;
      text-align: right;
    }
    .rate-input:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(201, 164, 76, 0.25);
    }

    .inverse-label {
      color: var(--green-soft, #5C7A68);
      font-weight: 600;
    }
    .inverse-value {
      color: var(--ink, #132018);
      font-weight: 600;
    }

    .rate-meta {
      margin-top: 0.3rem;
    }
    .updated {
      font-size: 0.7rem;
      color: var(--green-soft, #5C7A68);
      font-style: italic;
    }

    /* Actions */
    .rate-actions {
      display: flex; gap: 0.5rem; justify-content: flex-end;
      margin-top: auto;
    }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 0.4rem;
      padding: 0.7rem 1.3rem;
      border-radius: var(--r, 8px);
      font-size: 0.82rem; font-weight: 700;
      cursor: pointer; border: 0;
      transition: background 0.3s, transform 0.3s, color 0.3s, box-shadow 0.3s;
    }
    .btn--sm { padding: 0.55rem 1rem; font-size: 0.76rem; }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .btn--gold:hover:not(:disabled) {
      background: var(--gold-lt, #E4C783);
      transform: translateY(-1px);
      box-shadow: 0 10px 20px -10px rgba(201, 164, 76, 0.7);
    }
    .btn--gold:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn--outline {
      background: transparent;
      border: 1.5px solid var(--green, #0F2A1D);
      color: var(--green, #0F2A1D);
    }
    .btn--outline:hover:not(:disabled) { background: var(--green, #0F2A1D); color: var(--ivory, #F7F4EC); }
    .btn--outline:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--ghost {
      background: transparent;
      color: var(--green-soft, #5C7A68);
    }
    .btn--ghost:hover:not(:disabled) { background: var(--ivory-2, #EFEADD); color: var(--green, #0F2A1D); }
    .btn--ghost:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Mini spinner inside refresh button */
    .mini-spinner {
      width: 14px; height: 14px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AdminExchangeRatesComponent implements OnInit {
  private currencyService = inject(CurrencyService);
  private toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  isLoading = signal(true);
  /** The API's message when the read failed; null when it didn't. */
  loadError = signal<string | null>(null);
  isRefreshing = signal(false);
  updatedAt = signal<string | null>(null);

  rows = signal<RateRow[]>([]);

  lastUpdated = computed(() => {
    const u = this.updatedAt();
    if (!u) return '';
    const d = new Date(u);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    return `${days} d ago`;
  });

  ngOnInit(): void {
    this.load();
  }

  // ------------------------------------------------------------
  // Load
  // ------------------------------------------------------------
  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.currencyService.getRates().subscribe({
      next: (res) => {
        this.updatedAt.set(res.updatedAt);
        this.rows.set(this.buildRows(res.rates));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load rates', err);
        this.rows.set([]);
        this.updatedAt.set(null);
        this.loadError.set(adminErrorDetail(err));
        this.toast.show(this.i18n.t('admin.rates.loadErrTitle'));
        this.isLoading.set(false);
      },
    });
  }

  private buildRows(rates: Record<string, number>): RateRow[] {
    return Object.entries(rates)
      .map(([code, rate]) => {
        const meta = CURRENCY_META[code] ?? {
          code,
          name: code,
          symbol: '',
          flag: '🏳️',
        };
        return {
          code,
          name: meta.name,
          symbol: meta.symbol,
          flag: meta.flag,
          rate,
          editing: false,
          draftRate: rate,
          isSaving: false,
          isDirty: false,
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  // ------------------------------------------------------------
  // Refresh from API
  // ------------------------------------------------------------
  refresh(): void {
    this.isRefreshing.set(true);
    this.currencyService.refresh().subscribe({
      next: () => {
        this.isRefreshing.set(false);
        this.toast.show('Rates refreshed');
        this.load();
      },
      error: (err) => {
        console.error('Refresh failed', err);
        this.isRefreshing.set(false);
        this.toast.show(err.error?.error || 'Failed to refresh rates');
      },
    });
  }

  // ------------------------------------------------------------
  // Manual override
  // ------------------------------------------------------------
  startEdit(row: RateRow): void {
    row.editing = true;
    row.draftRate = row.rate;
    row.isDirty = false;
  }

  cancelEdit(row: RateRow): void {
    row.editing = false;
    row.draftRate = row.rate;
    row.isDirty = false;
  }

  onDraftChange(row: RateRow, value: number | string): void {
    const num = Number(value);
    row.draftRate = isNaN(num) || num < 0 ? 0 : num;
    row.isDirty = row.draftRate !== row.rate;
  }

  saveRow(row: RateRow): void {
    if (!row.isDirty || row.isSaving) return;

    row.isSaving = true;
    this.currencyService.setRate(row.code, row.draftRate).subscribe({
      next: (res) => {
        row.rate = res.rate;
        row.draftRate = res.rate;
        row.editing = false;
        row.isDirty = false;
        row.isSaving = false;
        this.updatedAt.set(res.updatedAt);
        this.toast.show(`${row.code} rate updated`);
      },
      error: (err) => {
        console.error('Save rate failed', err);
        row.isSaving = false;
        const msg = err.error?.error || 'Failed to update rate';
        this.toast.show(msg);
      },
    });
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  trackByCode(_i: number, row: RateRow): string {
    return row.code;
  }

  inverseRate(row: RateRow): string {
    if (!row.rate || row.rate <= 0) return '—';
    const inverse = 1 / row.rate;
    return inverse.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatUpdated(iso: string | null): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}