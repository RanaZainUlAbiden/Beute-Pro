import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CouponService } from '../../services/coupon.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { adminErrorDetail } from '../admin-api';
import { ApiCoupon } from '../../core/models/api.model';

import { LoadingSpinnerComponent } from '../ui/loading-spinner.component';
import { LoadErrorComponent } from '../ui/load-error/load-error.component';
import { ConfirmDialogComponent } from '../ui/confirm-dialog.component';
import { CouponFormComponent } from './coupon-form.component';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    LoadErrorComponent,
    ConfirmDialogComponent,
    CouponFormComponent,
  ],
  template: `
    <div class="admin-coupons">
      <!-- Header -->
      <div class="page-head">
        <div>
          <h1 class="h-lg">Coupons</h1>
          <p class="page-sub" *ngIf="!isLoading() && loadError() === null">
            {{ coupons().length }} coupon{{ coupons().length === 1 ? '' : 's' }}
            · <span class="active-count">{{ activeCount() }} active</span>
          </p>
          <p class="page-sub" *ngIf="isLoading() || loadError() !== null">—</p>
        </div>
        <button class="btn btn--gold" (click)="openCreate()">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" fill="none"/>
          </svg>
          New coupon
        </button>
      </div>

      <!-- Filter -->
      <div class="filters">
        <label class="toggle-filter">
          <input type="checkbox" [(ngModel)]="activeOnly" (ngModelChange)="onFilterChange()" />
          <span>Active only</span>
        </label>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="isLoading()" message="Loading coupons…"></app-loading-spinner>

      <!-- Load failed — shown INSTEAD of the empty state, so a dead
           API never reads as "no coupons yet". -->
      <app-load-error
        *ngIf="!isLoading() && loadError() !== null"
        [detail]="loadError()!"
        (retry)="loadCoupons()"
      ></app-load-error>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!isLoading() && loadError() === null && coupons().length === 0">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"
                stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
        <p>No coupons yet.</p>
        <button class="btn btn--gold" (click)="openCreate()">Create your first coupon</button>
      </div>

      <!-- Grid -->
      <div class="coupon-grid" *ngIf="!isLoading() && loadError() === null && coupons().length > 0">
        <div class="coupon-card" *ngFor="let c of coupons()" [class.is-expired]="isExpired(c)">
          <!-- Top row: code + status -->
          <div class="card-head">
            <div class="code-wrap">
              <span class="code">{{ c.code }}</span>
              <button class="copy-btn" (click)="copyCode(c.code)" title="Copy code">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
            </div>
            <span class="status-pill"
                  [class.status-pill--active]="c.isActive && !isExpired(c)"
                  [class.status-pill--expired]="isExpired(c)"
                  [class.status-pill--off]="!c.isActive && !isExpired(c)">
              {{ statusLabel(c) }}
            </span>
          </div>

          <!-- Big discount -->
          <div class="discount">
            <span class="discount-value">
              {{ c.discountType === 'percentage' ? c.discountValue + '%' : '₨ ' + (c.discountValue | number) }}
            </span>
            <span class="discount-label">off</span>
          </div>

          <!-- Meta -->
          <div class="meta">
            <div class="meta-row">
              <span class="meta-label">Min order</span>
              <span class="meta-value">₨ {{ c.minOrderValue | number }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Usage</span>
              <span class="meta-value">
                {{ c.usedCount }} / {{ c.maxUses !== null ? c.maxUses : '∞' }}
              </span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Expires</span>
              <span class="meta-value">{{ formatExpiry(c) }}</span>
            </div>
          </div>

          <!-- Usage bar -->
          <div class="progress" *ngIf="c.maxUses !== null">
            <div class="progress-bar" [style.width.%]="usagePercent(c)"></div>
          </div>

          <!-- Actions -->
          <div class="card-actions">
            <button class="btn btn--outline btn--sm" (click)="openEdit(c)">Edit</button>
            <button class="btn btn--danger-outline btn--sm" (click)="confirmDelete(c)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Form modal -->
      <app-coupon-form
        [isOpen]="formOpen()"
        [coupon]="editing()"
        (saved)="onFormSaved()"
        (cancelled)="closeForm()"
      ></app-coupon-form>

      <!-- Confirm delete -->
      <app-confirm-dialog
        [isOpen]="deleteDialogOpen()"
        title="Delete coupon?"
        [message]="'Are you sure you want to delete “' + (pendingDelete()?.code || '') + '”? This action cannot be undone.'"
        confirmText="Delete"
        variant="danger"
        [isLoading]="isDeleting()"
        (confirm)="doDelete()"
        (cancel)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .admin-coupons { padding: 0; }

    .page-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
    }
    .page-head h1 { margin: 0 0 0.25rem; color: var(--green, #0F2A1D); }
    .page-sub { margin: 0; font-size: 0.88rem; color: var(--green-soft, #5C7A68); }
    .active-count { color: #1e8449; font-weight: 700; }

    .filters { margin-bottom: 1.25rem; }
    .toggle-filter {
      display: inline-flex; align-items: center; gap: 0.5rem;
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
    .toggle-filter input { width: 16px; height: 16px; accent-color: var(--gold, #C9A44C); cursor: pointer; }

    /* Empty */
    .empty-state {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--green-soft, #5C7A68);
    }
    .empty-state svg { color: var(--ivory-3, #E2DBC9); margin-bottom: 0.75rem; }
    .empty-state p { margin: 0 0 1rem; font-size: 0.95rem; }

    /* Grid */
    .coupon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.1rem;
    }

    .coupon-card {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 1.3rem 1.4rem 1.1rem;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.04);
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      display: flex; flex-direction: column; gap: 0.9rem;
      transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
      position: relative;
      overflow: hidden;
    }
    .coupon-card:hover {
      border-color: var(--gold, #C9A44C);
      transform: translateY(-2px);
      box-shadow: 0 10px 24px -10px rgba(15, 42, 29, 0.15);
    }
    .coupon-card.is-expired { opacity: 0.7; }
    .coupon-card.is-expired:hover { transform: none; }

    /* Head */
    .card-head {
      display: flex; justify-content: space-between; align-items: center;
      gap: 0.75rem;
    }
    .code-wrap {
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.4rem 0.7rem;
      border-radius: var(--r, 8px);
      background: var(--ivory-2, #EFEADD);
      min-width: 0;
    }
    .code {
      font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
      font-size: 0.9rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--green, #0F2A1D);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .copy-btn {
      background: transparent; border: 0;
      width: 22px; height: 22px;
      display: grid; place-items: center;
      color: var(--green-soft, #5C7A68);
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.2s, color 0.2s;
    }
    .copy-btn:hover { background: var(--ivory-3, #E2DBC9); color: var(--green, #0F2A1D); }

    .status-pill {
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
    .status-pill--active { background: rgba(46, 204, 113, 0.14); color: #1e8449; }
    .status-pill--expired { background: rgba(168, 68, 60, 0.14); color: #a8443c; }
    .status-pill--off { background: var(--ivory-2, #EFEADD); color: var(--green-soft, #5C7A68); }

    /* Big discount */
    .discount {
      display: flex; align-items: baseline; gap: 0.4rem;
    }
    .discount-value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--gold, #C9A44C);
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .discount-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--green-soft, #5C7A68);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Meta */
    .meta { display: flex; flex-direction: column; gap: 0.35rem; }
    .meta-row {
      display: flex; justify-content: space-between;
      font-size: 0.82rem;
    }
    .meta-label { color: var(--green-soft, #5C7A68); }
    .meta-value { color: var(--ink, #132018); font-weight: 600; }

    /* Usage bar */
    .progress {
      height: 5px;
      background: var(--ivory-3, #E2DBC9);
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: var(--gold, #C9A44C);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    /* Actions */
    .card-actions {
      display: flex; gap: 0.5rem;
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px dashed var(--ivory-3, #E2DBC9);
    }
    .btn {
      padding: 0.55rem 1rem;
      border-radius: var(--r, 8px);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: background 0.3s, color 0.3s, transform 0.3s;
      flex: 1;
    }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); border: 0; }
    .btn--gold:hover { background: var(--gold-lt, #E4C783); transform: translateY(-1px); }
    .btn--outline {
      background: transparent;
      border-color: var(--green, #0F2A1D);
      color: var(--green, #0F2A1D);
    }
    .btn--outline:hover { background: var(--green, #0F2A1D); color: var(--ivory, #F7F4EC); }
    .btn--danger-outline {
      background: transparent;
      border-color: #a8443c;
      color: #a8443c;
    }
    .btn--danger-outline:hover { background: #a8443c; color: #fff; }
    .btn--sm { padding: 0.55rem 0.9rem; }
  `],
})
export class AdminCouponsComponent implements OnInit {
  private couponService = inject(CouponService);
  private toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  coupons = signal<ApiCoupon[]>([]);
  isLoading = signal(true);
  /** The API's message when the read failed; null when it didn't. */
  loadError = signal<string | null>(null);

  activeOnly = false;

  // Form state
  formOpen = signal(false);
  editing = signal<ApiCoupon | null>(null);

  // Delete state
  deleteDialogOpen = signal(false);
  pendingDelete = signal<ApiCoupon | null>(null);
  isDeleting = signal(false);

  activeCount = computed(
    () => this.coupons().filter((c) => c.isActive && !this.isExpired(c)).length
  );

  ngOnInit(): void {
    this.loadCoupons();
  }

  // ------------------------------------------------------------
  loadCoupons(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.couponService
      .adminList({ activeOnly: this.activeOnly, limit: 200 })
      .subscribe({
        next: (res) => {
          this.loadError.set(null);
          this.coupons.set(res.coupons);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load coupons', err);
          this.coupons.set([]);
          this.loadError.set(adminErrorDetail(err, this.i18n.t('admin.common.apiDown')));
          this.toast.show(this.i18n.t('admin.common.loadFailed'));
          this.isLoading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.loadCoupons();
  }

  // ------------------------------------------------------------
  // Form
  openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  openEdit(c: ApiCoupon): void {
    this.editing.set(c);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  onFormSaved(): void {
    this.closeForm();
    this.loadCoupons();
  }

  // ------------------------------------------------------------
  // Helpers
  isExpired(c: ApiCoupon): boolean {
    return c.expiresAt !== null && new Date(c.expiresAt) < new Date();
  }

  statusLabel(c: ApiCoupon): string {
    if (this.isExpired(c)) return 'Expired';
    if (!c.isActive) return 'Inactive';
    return 'Active';
  }

  usagePercent(c: ApiCoupon): number {
    if (c.maxUses === null || c.maxUses === 0) return 0;
    return Math.min(100, Math.round((c.usedCount / c.maxUses) * 100));
  }

  formatExpiry(c: ApiCoupon): string {
    if (!c.expiresAt) return 'Never';
    const d = new Date(c.expiresAt);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  copyCode(code: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.toast.show(`Copied “${code}”`);
      }).catch(() => this.toast.show('Failed to copy'));
    } else {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.toast.show(`Copied “${code}”`);
    }
  }

  // ------------------------------------------------------------
  // Delete
  confirmDelete(c: ApiCoupon): void {
    this.pendingDelete.set(c);
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.pendingDelete.set(null);
  }

  doDelete(): void {
    const c = this.pendingDelete();
    if (!c) return;

    this.isDeleting.set(true);
    this.couponService.adminRemove(c.code).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deleteDialogOpen.set(false);
        this.pendingDelete.set(null);
        this.toast.show(`“${c.code}” deleted`);
        this.loadCoupons();
      },
      error: (err) => {
        console.error('Delete coupon failed', err);
        this.isDeleting.set(false);
        this.toast.show(err.error?.error || 'Failed to delete coupon');
        this.cancelDelete();
      },
    });
  }
}