import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminApi, adminDate, adminMoney } from '../admin-api';
import { ALL_STATUSES, statusKey, statusPill } from '../../features/orders/order-view';
import { I18nService } from '../../core/services/i18n.service';
import type { Order } from '../../services/order';

type SortKey = 'order_number' | 'created_at' | 'customer_name' | 'total_amount_pkr' | 'status';

/* =============================================================
   ORDERS (admin)

   The screen the shop is run from, so it is a table: one row per
   order, 25 to a page, sortable by every column that means
   anything and searchable by number, name, email or phone.

   Where the work happens matters here. The status filter and the
   pager are the server's — it pages and filters in SQL. Sorting
   and the search box work on the page in front of you, which is
   what the endpoint supports; the count line says so rather than
   implying the whole table was searched.
   ============================================================= */
@Component({
  selector: 'app-admin-orders',
  imports: [RouterLink],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private readonly api = inject(AdminApi);
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

  /** The loaded page, searched and sorted. */
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
    // dates and money read newest/largest first; text reads A→Z
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
}
