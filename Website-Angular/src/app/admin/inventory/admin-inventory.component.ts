import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InventoryService } from '../../services/inventory.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiInventoryRow } from '../../core/models/api.model';

import { LoadingSpinnerComponent } from '../ui/loading-spinner.component';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="admin-inventory">
      <!-- Header -->
      <div class="page-head">
        <div>
          <h1 class="h-lg">Inventory</h1>
          <p class="page-sub">
            {{ rows().length }} product{{ rows().length === 1 ? '' : 's' }}
            <ng-container *ngIf="lowStockCount() > 0">
              · <span class="low-warn">{{ lowStockCount() }} low on stock</span>
            </ng-container>
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="filter-search">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" fill="none"/>
            <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
          </svg>
          <input
            type="text"
            placeholder="Search products…"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>

        <label class="toggle-filter">
          <input
            type="checkbox"
            [(ngModel)]="lowStockOnly"
            (ngModelChange)="onLowStockChange($event)"
          />
          <span>Low stock only</span>
        </label>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="isLoading()" message="Loading inventory…"></app-loading-spinner>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!isLoading() && rows().length === 0">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path d="M6 7h12l-1.2 12H7.2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <path d="M9 7a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
        <p>No products match your filter.</p>
      </div>

      <!-- Table -->
      <div class="table-card" *ngIf="!isLoading() && rows().length > 0">
        <div class="table-header">
          <span>Product</span>
          <span class="col-threshold">Low-stock at</span>
          <span class="col-qty">In stock</span>
          <span class="col-status">Status</span>
          <span class="col-actions">Update</span>
        </div>

        <div
          class="table-row"
          *ngFor="let row of rows(); trackBy: trackByProductId"
          [class.is-low]="row.isLow"
        >
          <span class="col-product">
            <strong>{{ row.productNameEn }}</strong>
            <small>{{ row.productId }}</small>
          </span>

          <span class="col-threshold">
            <input
              type="number"
              class="inline-input"
              [ngModel]="row.lowStockThreshold"
              (ngModelChange)="onThresholdChange(row, $event)"
              min="0"
            />
          </span>

          <span class="col-qty">
            <input
              type="number"
              class="inline-input inline-input--qty"
              [ngModel]="row.quantity"
              (ngModelChange)="onQtyChange(row, $event)"
              min="0"
            />
          </span>

          <span class="col-status">
            <span class="status-pill" [class.status-pill--ok]="!row.isLow" [class.status-pill--low]="row.isLow">
              <span class="status-dot"></span>
              {{ row.isLow ? 'Low' : 'OK' }}
            </span>
          </span>

          <span class="col-actions">
            <button
              class="btn btn--sm"
              [class.btn--gold]="row.isDirty"
              [class.btn--ghost]="!row.isDirty"
              [disabled]="!row.isDirty || row.isSaving"
              (click)="saveRow(row)"
            >
              {{ row.isSaving ? 'Saving…' : (row.isDirty ? 'Save' : 'Saved') }}
            </button>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-inventory { padding: 0; }

    .page-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
    }
    .page-head h1 { margin: 0 0 0.25rem; color: var(--green, #0F2A1D); }
    .page-sub { margin: 0; font-size: 0.88rem; color: var(--green-soft, #5C7A68); }
    .low-warn { color: #a8443c; font-weight: 700; }

    /* Filters */
    .filters {
      display: flex; gap: 0.75rem; flex-wrap: wrap;
      align-items: center; margin-bottom: 1.25rem;
    }
    .filter-search {
      display: flex; align-items: center; gap: 0.5rem;
      flex: 1 1 280px;
      background: var(--white, #fff);
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      padding: 0 0.9rem;
      transition: border-color 0.3s;
    }
    .filter-search:focus-within { border-color: var(--gold, #C9A44C); }
    .filter-search svg { color: var(--green-soft, #5C7A68); flex-shrink: 0; }
    .filter-search input {
      border: 0; outline: none; flex: 1;
      padding: 0.7rem 0;
      font-size: 0.9rem; font-family: inherit;
      background: transparent; color: var(--ink, #132018);
    }
    .toggle-filter {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.85rem; font-weight: 600;
      color: var(--green, #0F2A1D);
      cursor: pointer;
      padding: 0.6rem 1rem;
      border-radius: var(--r, 8px);
      background: var(--white, #fff);
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      transition: border-color 0.3s;
    }
    .toggle-filter:hover { border-color: var(--gold, #C9A44C); }
    .toggle-filter input {
      width: 16px; height: 16px;
      accent-color: var(--gold, #C9A44C);
      cursor: pointer;
    }

    /* Empty */
    .empty-state {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--green-soft, #5C7A68);
    }
    .empty-state svg { color: var(--ivory-3, #E2DBC9); margin-bottom: 0.75rem; }
    .empty-state p { margin: 0; font-size: 0.95rem; }

    /* Table */
    .table-card {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.04);
    }
    .table-header, .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1.2fr;
      gap: 1rem;
      padding: 0.9rem 1.25rem;
      align-items: center;
    }
    .table-header {
      background: var(--green, #0F2A1D);
      color: var(--ivory, #F7F4EC);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .table-row {
      border-bottom: 1px solid var(--ivory-3, #E2DBC9);
      transition: background 0.2s;
      font-size: 0.88rem;
    }
    .table-row:hover { background: var(--ivory-2, #EFEADD); }
    .table-row:last-child { border-bottom: 0; }

    /* Low-stock row accent */
    .table-row.is-low {
      background: rgba(168, 68, 60, 0.04);
      border-left: 3px solid #a8443c;
      padding-left: calc(1.25rem - 3px);
    }
    .table-row.is-low:hover { background: rgba(168, 68, 60, 0.08); }

    .col-product strong { display: block; color: var(--ink, #132018); font-weight: 600; }
    .col-product small { color: var(--green-soft, #5C7A68); font-size: 0.72rem; font-family: monospace; }

    .col-threshold, .col-qty { display: flex; }
    .col-qty { justify-content: flex-start; }
    .col-status { display: flex; }
    .col-actions { display: flex; justify-content: flex-end; }

    .inline-input {
      width: 90px;
      padding: 0.5rem 0.7rem;
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      font-size: 0.88rem;
      font-family: inherit;
      color: var(--ink, #132018);
      background: var(--white, #fff);
      transition: border-color 0.3s, box-shadow 0.3s;
      text-align: center;
    }
    .inline-input--qty {
      width: 100px;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .inline-input:focus {
      outline: none;
      border-color: var(--gold, #C9A44C);
      box-shadow: 0 0 0 3px rgba(201, 164, 76, 0.15);
    }

    .status-pill {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .status-pill--ok { background: rgba(46, 204, 113, 0.12); color: #1e8449; }
    .status-pill--low { background: rgba(168, 68, 60, 0.14); color: #a8443c; }
    .status-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: currentColor;
    }

    /* Buttons */
    .btn {
      padding: 0.5rem 1rem;
      border-radius: var(--r, 8px);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      border: 0;
      transition: background 0.3s, transform 0.3s, color 0.3s;
    }
    .btn--sm { min-width: 80px; }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .btn--gold:hover:not(:disabled) {
      background: var(--gold-lt, #E4C783);
      transform: translateY(-1px);
    }
    .btn--ghost {
      background: transparent;
      color: var(--green-soft, #5C7A68);
      cursor: default;
    }
    .btn:disabled { cursor: not-allowed; }
    .btn--gold:disabled { opacity: 0.55; }

    @media (max-width: 900px) {
      .table-header, .table-row {
        grid-template-columns: 2fr 1fr 1fr;
      }
      .table-header span:nth-child(n+4),
      .table-row > span:nth-child(n+4) { display: none; }
    }
  `],
})
export class AdminInventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private toast = inject(ToastService);

  rows = signal<InventoryRowWithState[]>([]);
  isLoading = signal(true);

  searchTerm = '';
  lowStockOnly = false;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  lowStockCount = computed(() => this.rows().filter((r) => r.isLow).length);

  ngOnInit(): void {
    this.loadInventory();
  }

  // ------------------------------------------------------------
  // Load
  // ------------------------------------------------------------
  loadInventory(): void {
    this.isLoading.set(true);
    this.inventoryService
      .adminList({
        search: this.searchTerm || undefined,
        lowStockOnly: this.lowStockOnly,
      })
      .subscribe({
        next: (res) => {
          const enriched: InventoryRowWithState[] = res.items.map((item) => ({
            ...item,
            isDirty: false,
            isSaving: false,
          }));
          this.rows.set(enriched);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load inventory', err);
          this.toast.show('Failed to load inventory');
          this.isLoading.set(false);
        },
      });
  }

  onSearchChange(value: string): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.searchTerm = value;
      this.loadInventory();
    }, 300);
  }

  onLowStockChange(value: boolean): void {
    this.lowStockOnly = value;
    this.loadInventory();
  }

  // ------------------------------------------------------------
  // Inline edit
  // ------------------------------------------------------------
  onThresholdChange(row: InventoryRowWithState, value: number): void {
    row.lowStockThreshold = Number(value) || 0;
    row.isDirty = true;
  }

  onQtyChange(row: InventoryRowWithState, value: number): void {
    row.quantity = Number(value) || 0;
    // Recompute isLow locally so the row accent updates immediately
    row.isLow = row.quantity <= row.lowStockThreshold;
    row.isDirty = true;
  }

  // ------------------------------------------------------------
  // Save
  // ------------------------------------------------------------
  saveRow(row: InventoryRowWithState): void {
    if (!row.isDirty || row.isSaving) return;

    row.isSaving = true;

    this.inventoryService
      .adminSet(row.productId, row.quantity, row.lowStockThreshold)
      .subscribe({
        next: (res) => {
          row.quantity = res.inventory.quantity;
          row.lowStockThreshold = res.inventory.lowStockThreshold;
          row.isLow = row.quantity <= row.lowStockThreshold;
          row.isDirty = false;
          row.isSaving = false;
          this.toast.show(`Stock updated for ${row.productNameEn}`);
        },
        error: (err) => {
          console.error('Failed to update inventory', err);
          row.isSaving = false;
          this.toast.show(err.error?.error || 'Failed to update stock');
          // Reload to get back to server truth
          this.loadInventory();
        },
      });
  }

  trackByProductId(_i: number, row: InventoryRowWithState): string {
    return row.productId;
  }
}

// ============================================================
// Local helper type — extends the API row with UI-only flags
// ============================================================
interface InventoryRowWithState extends ApiInventoryRow {
  isDirty: boolean;
  isSaving: boolean;
}