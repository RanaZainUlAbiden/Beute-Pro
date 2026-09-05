import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService, Order } from '../../../services/order';
import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './track-order.html',
  styleUrls: ['./track-order.scss'],
})
export class TrackOrderComponent {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  private i18n = inject(I18nService);
  private toast = inject(ToastService);

  trackForm: FormGroup;
  order: Order | null = null;
  isLoading = false;
  errorMessage = '';
  searched = false;

  constructor() {
    this.trackForm = this.fb.group({
      orderNumber: ['', [Validators.required, Validators.pattern(/^BP-\d{4}$/)]],
    });
  }

  get f() { return this.trackForm.controls; }

  onSubmit(): void {
    if (this.trackForm.invalid) {
      this.trackForm.markAllAsTouched();
      return;
    }

    const orderNumber = this.trackForm.value.orderNumber.trim();
    this.searched = true;
    this.isLoading = true;
    this.errorMessage = '';
    this.order = null;

    this.orderService.getOrderByNumber(orderNumber).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.order = response.order;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Order not found. Please check the order number.';
        this.toast.show(this.errorMessage);
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-badge status-badge--${status}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatPrice(amount: string): string {
    return this.i18n.money(parseFloat(amount));
  }

  getTotalItems(): number {
    return this.order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }
}