import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/services/i18n.service';
import { statusKey, statusPill } from '../order-view';
import { OrderService, type Order } from '../../../services/order';

/* =============================================================
   MY ORDERS

   A list, not a dashboard: order number, date, item count, total
   and status, with the whole row a link into the detail page.
   Three states — loading, failed, and the empty state, which is
   an invitation to the shop rather than a shrug.
   ============================================================= */
@Component({
  selector: 'app-orders-page',
  imports: [RouterLink],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
})
export class OrdersPageComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  protected readonly i18n = inject(I18nService);

  protected readonly orders = signal<readonly Order[]>([]);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orders.set(res.orders ?? []);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }

  protected statusLabel(status: string): string {
    return this.i18n.t(statusKey(status));
  }

  protected statusPill(status: string): string {
    return statusPill(status);
  }

  protected itemCount(order: Order): number {
    return (order.items ?? []).reduce((n, i) => n + i.quantity, 0);
  }

  protected date(value: string): string {
    return new Date(value).toLocaleDateString(this.i18n.isRTL() ? 'ar-EG' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  protected money(amount: string): string {
    return this.i18n.money(parseFloat(amount));
  }
}
