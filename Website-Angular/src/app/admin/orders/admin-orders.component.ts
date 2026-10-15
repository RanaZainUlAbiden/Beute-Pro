import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminApi, adminDate, adminMoney } from '../admin-api';
import { ALL_STATUSES, statusKey, statusPill } from '../../features/orders/order-view';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../services/export.service';
import { OrderService } from '../../services/order';
import type { Order } from '../../services/order';

// ✅ Reusable admin UI components from Phase 5F.2
import { BulkActionsBarComponent } from '../ui/bulk-actions-bar.component';
import { CsvExportButtonComponent } from '../ui/csv-export-button.component';
import { ConfirmDialogComponent } from '../ui/confirm-dialog.component';

type SortKey = 'order_number' | 'created_at' | 'customer_name' | 'total_amount_pkr' | 'status';

@Component({
  selector: 'app-admin-orders',
  imports: [
    RouterLink,
    BulkActionsBarComponent,
    CsvExportButtonComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly orderService = inject(OrderService);
  private readonly exportService = inject(ExportService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  protected readonly statuses = ALL_STATUSES;
  protected readonly money = adminMoney;
  protected readonly date = adminDate;
  protected readonly pill = statusPill;
  protected readonly statusLabel = (status: string) => this.i18n.t(statusKey(status));

  protected readonly orders = signal<readonly Order[]>([]);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  protected readonly page = signal(1);
  protected readonly limit = 25;
  protected readonly totalPages = signal(1);
  protected readonly total = signal(0);

  protected readonly status = signal('');
  protected readonly search = signal('');
  protected readonly sortKey = signal<SortKey>('created_at');
  protected readonly sortDesc = signal(true);

  // ✅ Bulk selection
  protected readonly selected = signal<Set<number>>(new Set());
  protected readonly bulkBusy = signal(false);
  protected readonly exportBusy = signal(false);

  // Delete confirmation
  protected readonly deleteDialogOpen = signal(false);

  protected readonly rows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const key = this.sortKey();
    const dir = this.sortDesc() ? -1 : 1;

    const found = q
      ? this.orders().filter((o) =>
          [o.order_number, o.customer_name, o.customer_email, o.customer_phone]
            .some((v) => (v ?? '').toLowerCase().includes(q)),
        )
      : [...this.orders()];

    return found.sort((a, b) => {
      if (key === 'total_amount_pkr') {
        return (parseFloat(a.total_amount_pkr) - parseFloat(b.total_amount_pkr)) * dir;
      }
      if (key === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
      return String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir;
    });
  });

  protected readonly selectedCount = computed(() => this.selected().size);

  protected readonly allOnPageSelected = computed(() => {
    const pageIds = this.rows().map((o) => o.id);
    if (!pageIds.length) return false;
    const sel = this.selected();
    return pageIds.every((id) => sel.has(id));
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.orders(this.page(), this.limit, this.status() || undefined).subscribe({
      next: (res) => {
        this.orders.set(res.orders ?? []);
        this.total.set(res.total ?? 0);
        this.totalPages.set(Math.max(1, res.totalPages ?? 1));
        this.busy.set(false);
        // Clear selection on reload
        this.selected.set(new Set());
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }

  protected onStatus(value: string): void {
    this.status.set(value);
    this.page.set(1);
    this.load();
  }

  protected goto(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  protected sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDesc.update((v) => !v);
      return;
    }
    this.sortKey.set(key);
    this.sortDesc.set(key === 'created_at' || key === 'total_amount_pkr');
  }

  protected sortState(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortDesc() ? 'descending' : 'ascending';
  }

  protected itemCount(order: Order): number {
    return (order.items ?? []).reduce((n, i) => n + i.quantity, 0);
  }

  protected clearSearch(): void {
    this.search.set('');
  }

  // ------------------------------------------------------------
  // ✅ Selection
  // ------------------------------------------------------------
  protected toggleOne(id: number): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected toggleAll(): void {
    if (this.allOnPageSelected()) {
      // Deselect all on this page
      this.selected.update((set) => {
        const next = new Set(set);
        for (const o of this.rows()) next.delete(o.id);
        return next;
      });
    } else {
      // Select all on this page
      this.selected.update((set) => {
        const next = new Set(set);
        for (const o of this.rows()) next.add(o.id);
        return next;
      });
    }
  }

  protected isSelected(id: number): boolean {
    return this.selected().has(id);
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  // ------------------------------------------------------------
  // ✅ Bulk actions
  // ------------------------------------------------------------

  /**
   * Bulk status change.
   *
   * The bar emits a plain `string` (its `EventEmitter<string>` is generic
   * because it doesn't know about the Order type). We cast at this boundary
   * — the option list inside the bar is hardcoded to the five valid status
   * values, so the cast is safe.
   */
  protected onBulkStatus(newStatus: string): void {
    const ids = Array.from(this.selected());
    if (!ids.length) return;

    this.bulkBusy.set(true);
    this.orderService
      .bulkUpdateStatus(ids, newStatus as Order['status'])
      .subscribe({
        next: (res) => {
          this.bulkBusy.set(false);
          this.toast.show(`${res.updated} order(s) marked as ${this.statusLabel(newStatus)}`);
          this.load();
        },
        error: (err) => {
          this.bulkBusy.set(false);
          this.toast.show(err.error?.error || 'Bulk update failed');
        },
      });
  }

  protected onBulkTracking(): void {
    const ids = Array.from(this.selected());
    if (!ids.length) return;

    // Simple prompts — a proper modal can be added later
    const trackingNumber = prompt('Tracking number:');
    if (!trackingNumber) return;
    const courierName = prompt('Courier name (e.g. TCS, Leopards):');
    if (!courierName) return;

    this.bulkBusy.set(true);
    this.orderService.bulkUpdateTracking(ids, trackingNumber, courierName).subscribe({
      next: (res) => {
        this.bulkBusy.set(false);
        this.toast.show(`Tracking saved on ${res.updated} order(s)`);
        this.load();
      },
      error: (err) => {
        this.bulkBusy.set(false);
        this.toast.show(err.error?.error || 'Bulk tracking failed');
      },
    });
  }

  protected onBulkExport(): void {
    this.exportBusy.set(true);
    this.exportService.download('orders', { status: this.status() || undefined }).subscribe({
      next: () => {
        this.exportBusy.set(false);
        this.toast.show('Download started');
      },
      error: (err) => {
        this.exportBusy.set(false);
        this.toast.show(err.error?.error || 'Export failed');
      },
    });
  }

  protected onBulkDelete(): void {
    if (!this.selected().size) return;
    this.deleteDialogOpen.set(true);
  }

  protected confirmBulkDelete(): void {
    // Backend doesn't have a bulk delete endpoint yet — cancel for now
    // and show a note. Add a dedicated DELETE /admin/orders/bulk endpoint
    // to enable this.
    this.deleteDialogOpen.set(false);
    this.toast.show('Bulk delete is not available yet');
  }

  protected cancelBulkDelete(): void {
    this.deleteDialogOpen.set(false);
  }
}