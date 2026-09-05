import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService, Order } from '../../../services/order';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders-page.html',
  styleUrls: ['./orders-page.scss'],
})
export class OrdersPageComponent implements OnInit {
  private orderService = inject(OrderService);
  protected i18n = inject(I18nService);

  orders: Order[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.orderService.getMyOrders().subscribe({
      next: (response) => {
        this.orders = response.orders || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Failed to load orders. Please try again.';
        console.error('Error loading orders:', err);
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

  getTotalItems(order: Order): number {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatPrice(amount: string): string {
    return this.i18n.money(parseFloat(amount));
  }

  trackOrder(order: Order): void {
    // Navigate to order detail
    // We'll implement this in the next phase
    console.log('Track order:', order.order_number);
  }
}