import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { I18nService } from '../../../core/services/i18n.service';
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
   TRACK ORDER

   The one account page a visitor reaches without an account, so
   it carries its own explanation: what an order number looks
   like, where to find it, and what to do when it isn't found.

   Four states, and only one is on screen at a time — idle (the
   page as it loads, an invitation rather than a blank), busy,
   not-found, and the order itself.
   ============================================================= */
@Component({
  selector: 'app-track-order',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './track-order.html',
  styleUrl: './track-order.scss',
})
export class TrackOrderComponent {
  private readonly fb = inject(FormBuilder);
  private readonly orders = inject(OrderService);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  protected readonly form: FormGroup;
  protected readonly busy = signal(false);
  protected readonly notFound = signal(false);
  protected readonly order = signal<Order | null>(null);

  protected readonly flow = ORDER_FLOW;
  /** How far along the four-step rail this order has got. */
  protected readonly reached = computed(() => statusIndex(this.order()?.status));
  protected readonly cancelled = computed(() => this.order()?.status === 'cancelled');
  protected readonly itemCount = computed(() =>
    (this.order()?.items ?? []).reduce((n, i) => n + i.quantity, 0),
  );

  constructor() {
    this.form = this.fb.group({
      // BP-0001: the format the backend mints, so a typo is caught here
      // rather than as a 404 from the server
      orderNumber: ['', [Validators.required, Validators.pattern(/^\s*[Bb][Pp]-\d{4}\s*$/)]],
    });

    /* A guest who has just checked out arrives as /track?number=BP-0001,
       so the one thing they want is on screen without them retyping it.
       The lookup waits for the browser: this route is prerendered, and
       the build must not go to the API for it. */
    const number = this.route.snapshot.queryParamMap.get('number');
    if (number) {
      this.form.patchValue({ orderNumber: number });
      afterNextRender(() => this.submit());
    }
  }

  protected get invalid(): boolean {
    const c = this.form.get('orderNumber');
    return !!c && c.invalid && c.touched;
  }

  protected get fieldError(): string {
    const c = this.form.get('orderNumber');
    if (!c || c.valid) return '';
    return this.i18n.t(c.errors?.['required'] ? 'track.err.empty' : 'track.err.format');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const number = String(this.form.value.orderNumber).trim().toUpperCase();
    this.busy.set(true);
    this.notFound.set(false);
    this.order.set(null);

    this.orders.getOrderByNumber(number).subscribe({
      next: (res) => {
        this.busy.set(false);
        if (res.order) this.order.set(res.order);
        else this.notFound.set(true);
      },
      error: () => {
        this.busy.set(false);
        this.notFound.set(true);
      },
    });
  }

  protected reset(): void {
    this.order.set(null);
    this.notFound.set(false);
    this.form.reset({ orderNumber: '' });
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

  protected money(amount: string | number): string {
    return this.i18n.money(typeof amount === 'number' ? amount : parseFloat(amount));
  }
}
