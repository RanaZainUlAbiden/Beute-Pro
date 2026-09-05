import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminApi, adminDate, adminMoney, adminProductName } from '../admin-api';
import { ALL_STATUSES, statusKey, statusPill } from '../../features/orders/order-view';
import { ConfirmDialog } from '../ui/confirm-dialog/confirm-dialog';
import { I18nService } from '../../core/services/i18n.service';
import type { TranslationKey } from '../../core/data/i18n.data';
import type { Order } from '../../services/order';

/* =============================================================
   ORDER DETAIL (admin)

   The two things this screen exists to do — move an order along
   and attach a tracking number — sit at the top, above the read-
   only record of what was bought and where it is going.

   Cancelling asks first. It is the one status change a customer
   sees as final, and it is one mis-click away from "shipped" in
   the same dropdown.
   ============================================================= */
@Component({
  selector: 'app-admin-order-detail',
  imports: [ReactiveFormsModule, RouterLink, ConfirmDialog],
  templateUrl: './admin-order-detail.component.html',
  styleUrl: './admin-order-detail.component.scss',
})
export class AdminOrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AdminApi);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(I18nService);

  protected readonly statuses = ALL_STATUSES;
  protected readonly money = adminMoney;
  protected readonly date = adminDate;
  protected readonly productName = adminProductName;
  protected readonly pill = statusPill;
  protected readonly statusLabel = (status: string) => this.i18n.t(statusKey(status));
  protected readonly paymentMethodLabel = (method: string) =>
    this.i18n.t(`admin.payment.method.${method}` as TranslationKey);
  protected readonly paymentStatusLabel = (status: string) =>
    this.i18n.t(`admin.payment.status.${status}` as TranslationKey);

  protected readonly order = signal<Order | null>(null);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  protected readonly savingStatus = signal(false);
  protected readonly savingTracking = signal(false);
  protected readonly note = signal('');
  protected readonly error = signal('');
  /** A cancel waiting on the confirm dialog. */
  protected readonly pendingCancel = signal(false);
  /* What the dropdown is showing. Held separately from the order so a
     dismissed cancel puts the control back where it was — the order
     never changed, so binding to it would leave "cancelled" on screen. */
  protected readonly selectedStatus = signal('');

  protected readonly trackingForm: FormGroup;

  protected readonly itemCount = computed(() =>
    (this.order()?.items ?? []).reduce((n, i) => n + i.quantity, 0),
  );

  constructor() {
    this.trackingForm = this.fb.group({ trackingNumber: [''], courierName: [''] });
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.busy.set(false);
      this.failed.set(true);
      return;
    }
    this.busy.set(true);
    this.failed.set(false);
    this.api.order(id).subscribe({
      next: (res) => {
        this.order.set(res.order ?? null);
        this.failed.set(!res.order);
        this.selectedStatus.set(res.order?.status ?? '');
        this.trackingForm.patchValue({
          trackingNumber: res.order?.tracking_number ?? '',
          courierName: res.order?.courier_name ?? '',
        });
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }

  /** Status changes apply straight away — except a cancel, which asks. */
  protected chooseStatus(next: string): void {
    const order = this.order();
    if (!order || next === order.status) return;
    this.selectedStatus.set(next);
    if (next === 'cancelled') {
      this.pendingCancel.set(true);
      return;
    }
    this.applyStatus(next);
  }

  protected confirmCancel(): void {
    this.applyStatus('cancelled');
  }

  /** Dismissed the confirm: put the dropdown back on the real status. */
  protected abandonCancel(): void {
    this.pendingCancel.set(false);
    this.selectedStatus.set(this.order()?.status ?? '');
  }

  private applyStatus(next: string): void {
    const order = this.order();
    if (!order) return;
    this.savingStatus.set(true);
    this.error.set('');
    this.note.set('');
    this.api.setStatus(order.id, next).subscribe({
      next: () => {
        this.savingStatus.set(false);
        this.pendingCancel.set(false);
        this.order.set({ ...order, status: next as Order['status'] });
        this.note.set(this.i18n.t('admin.orderDetail.statusSetNote').replace('{status}', this.statusLabel(next)));
      },
      error: () => {
        this.savingStatus.set(false);
        this.pendingCancel.set(false);
        this.selectedStatus.set(order.status);
        this.error.set(this.i18n.t('admin.orderDetail.statusErr'));
      },
    });
  }

  protected saveTracking(): void {
    const order = this.order();
    if (!order || this.savingTracking()) return;
    const { trackingNumber, courierName } = this.trackingForm.value;
    this.savingTracking.set(true);
    this.error.set('');
    this.note.set('');
    this.api.setTracking(order.id, trackingNumber ?? '', courierName ?? '').subscribe({
      next: () => {
        this.savingTracking.set(false);
        this.order.set({
          ...order,
          tracking_number: trackingNumber || null,
          courier_name: courierName || null,
        });
        this.note.set(this.i18n.t('admin.orderDetail.trackingSavedNote'));
      },
      error: () => {
        this.savingTracking.set(false);
        this.error.set(this.i18n.t('admin.orderDetail.trackingErr'));
      },
    });
  }
}
