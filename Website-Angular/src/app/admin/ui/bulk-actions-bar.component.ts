import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bulk-actions-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bulk-bar" [class.is-active]="selectedCount > 0">
      <div class="bulk-bar__info">
        <span class="bulk-bar__count">{{ selectedCount }}</span>
        <span class="bulk-bar__label">
          {{ selectedCount === 1 ? 'item selected' : 'items selected' }}
        </span>
        <button class="bulk-bar__clear" (click)="clear.emit()" *ngIf="selectedCount > 0">
          Clear
        </button>
      </div>

      <div class="bulk-bar__actions" *ngIf="selectedCount > 0">
        <!-- Status update -->
        <ng-container *ngIf="showStatusAction">
          <select
            class="bulk-select"
            [(ngModel)]="pendingStatus"
            (ngModelChange)="onStatusSelected($event)"
            [disabled]="isLoading"
          >
            <option value="" disabled>Change status…</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </ng-container>

        <!-- Tracking update -->
        <ng-container *ngIf="showTrackingAction">
          <button class="btn btn--sm btn--outline" (click)="openTracking.emit()" [disabled]="isLoading">
            Add tracking
          </button>
        </ng-container>

        <!-- Export -->
        <ng-container *ngIf="showExportAction">
          <button class="btn btn--sm btn--outline" (click)="export.emit()" [disabled]="isLoading">
            <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right:4px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                    stroke="currentColor" stroke-width="2" fill="none"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Export CSV
          </button>
        </ng-container>

        <!-- Delete -->
        <ng-container *ngIf="showDeleteAction">
          <button class="btn btn--sm btn--danger" (click)="delete.emit()" [disabled]="isLoading">
            Delete
          </button>
        </ng-container>

        <span class="bulk-bar__loading" *ngIf="isLoading">Working…</span>
      </div>
    </div>
  `,
  styles: [`
    .bulk-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 0.75rem 1.2rem;
      border-radius: var(--r-lg, 18px);
      background: var(--ivory-2, #EFEADD);
      border: 1px solid var(--ivory-3, #E2DBC9);
      margin-bottom: 1rem;
      opacity: 0.55;
      transition: opacity 0.3s, background 0.3s, border-color 0.3s;
    }
    .bulk-bar.is-active {
      opacity: 1;
      background: var(--white, #fff);
      border-color: var(--gold, #C9A44C);
      box-shadow: 0 6px 20px -10px rgba(201, 164, 76, 0.4);
    }
    .bulk-bar__info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.88rem;
      color: var(--green-soft, #5C7A68);
    }
    .bulk-bar__count {
      font-weight: 800;
      color: var(--gold, #C9A44C);
      font-size: 1rem;
      min-width: 1.5rem;
      text-align: center;
    }
    .bulk-bar__label { font-weight: 600; }
    .bulk-bar__clear {
      background: none;
      border: 0;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--green-soft, #5C7A68);
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
    }
    .bulk-bar__clear:hover { color: var(--green, #0F2A1D); }
    .bulk-bar__actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .bulk-select {
      padding: 0.45rem 0.9rem;
      border-radius: var(--r, 8px);
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      background: var(--white, #fff);
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--green, #0F2A1D);
      cursor: pointer;
    }
    .bulk-select:focus {
      outline: none;
      border-color: var(--gold, #C9A44C);
    }
    .btn--sm {
      padding: 0.45rem 0.9rem;
      font-size: 0.78rem;
    }
    .btn--danger {
      background: #a8443c;
      color: #fff;
    }
    .btn--danger:hover {
      background: #8a2e2a;
    }
    .btn--danger:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .bulk-bar__loading {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--gold, #C9A44C);
    }
  `],
})
export class BulkActionsBarComponent {
  @Input() selectedCount = 0;
  @Input() isLoading = false;

  @Input() showStatusAction = false;
  @Input() showTrackingAction = false;
  @Input() showExportAction = false;
  @Input() showDeleteAction = false;

  @Output() statusChange = new EventEmitter<string>();
  @Output() openTracking = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  pendingStatus = '';

  onStatusSelected(status: string): void {
    if (!status) return;
    this.statusChange.emit(status);
    // Reset the select so the same option can be chosen again later
    setTimeout(() => (this.pendingStatus = ''), 100);
  }
}