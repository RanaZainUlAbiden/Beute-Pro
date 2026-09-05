import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';
import { PRODUCTS } from '../../../core/data/products';
import {
  ORDER_FLOW,
  itemName,
  statusIndex,
  statusKey,
  statusNoteKey,
  statusPill,
  type OrderStatus,
} from '../order-view';
import { OrderService, type Order, type OrderItem } from '../../../services/order';

/* =============================================================
   ORDER DETAIL

   The receipt. Same blocks and same rail as the public track
   page, so an order looks the same whether you arrived signed in
   or with a number — plus the two things only the buyer can do:
   put the same items back in the cart, and see how they paid.
   ============================================================= */
@Component({
  selector: 'app-order-detail',
  imports: [RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orders = inject(OrderService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  protected readonly order = signal<Order | null>(null);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  protected readonly flow = ORDER_FLOW;
  protected readonly reached = computed(() => statusIndex(this.order()?.status));
  protected readonly cancelled = computed(() => this.order()?.status === 'cancelled');
  protected readonly itemCount = computed(() =>
    (this.order()?.items ?? []).reduce((n, i) => n + i.quantity, 0),
  );
  /** Reorder only makes sense while at least one line is still sold. */
  protected readonly canReorder = computed(() =>
    (this.order()?.items ?? []).some((i) => PRODUCTS.some((p) => p.id === i.product_id)),
  );

  ngOnInit(): void {
    const number = this.route.snapshot.paramMap.get('orderNumber');
    if (!number) {
      this.router.navigate(['/orders']);
      return;
    }
    this.load(number);
  }

  protected load(number: string): void {
    this.busy.set(true);
    this.failed.set(false);
    this.orders.getOrderByNumber(number).subscribe({
      next: (res) => {
        this.order.set(res.order ?? null);
        this.failed.set(!res.order);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }

  protected retry(): void {
    const number = this.route.snapshot.paramMap.get('orderNumber');
    if (number) this.load(number);
  }

  /** Put every line still in the catalogue back in the cart, once. */
  protected reorder(): void {
    const items = this.order()?.items ?? [];
    let added = 0;
    for (const item of items) {
      if (!PRODUCTS.some((p) => p.id === item.product_id)) continue;
      const inCart = this.cart.items().find((l) => l.id === item.product_id)?.qty ?? 0;
      this.cart.setQty(item.product_id, inCart + item.quantity);
      added++;
    }
    if (!added) return;
    this.cart.open();
    this.toast.show(this.i18n.t('orders.reorder.done'));
  }

  protected statusLabel(status: string): string {
    return this.i18n.t(statusKey(status));
  }

  protected statusNote(status: string): string {
    return this.i18n.t(statusNoteKey(status));
  }

  protected statusPill(status: string): string {
    return statusPill(status);
  }

  protected itemName(item: OrderItem): string {
    return itemName(item, this.i18n.lang());
  }

  protected stepState(step: OrderStatus): string {
    if (this.cancelled()) return '';
    const at = this.reached();
    const i = ORDER_FLOW.indexOf(step as (typeof ORDER_FLOW)[number]);
    if (i < at) return 'is-done';
    if (i === at) return 'is-now';
    return '';
  }

  protected date(value: string): string {
    return new Date(value).toLocaleDateString(this.i18n.isRTL() ? 'ar-EG' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  protected money(amount: string): string {
    return this.i18n.money(parseFloat(amount));
  }

  /** `cod` → `Cash on delivery`, via the checkout copy. */
  protected payLabel(method: string): string {
    switch (method) {
      case 'cod':
        return this.i18n.t('checkout.pay.cod');
      case 'card':
        return this.i18n.t('checkout.pay.card');
      case 'bank_transfer':
        return this.i18n.t('checkout.pay.bank');
      default:
        return method;
    }
  }
}
