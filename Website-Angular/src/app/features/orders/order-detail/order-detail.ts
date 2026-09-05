import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { OrderService, Order } from '../../../services/order';
import { I18nService } from '../../../core/services/i18n.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.html',
  styleUrls: ['./order-detail.scss'],
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  protected i18n = inject(I18nService);
  private cart = inject(CartService); // ✅ CartService injected

  order: Order | null = null;
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber');
    if (!orderNumber) {
      this.router.navigate(['/orders']);
      return;
    }
    this.loadOrder(orderNumber);
  }

  loadOrder(orderNumber: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.orderService.getOrderByNumber(orderNumber).subscribe({
      next: (response) => {
        this.order = response.order;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Failed to load order details.';
        console.error('Error loading order:', err);
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

  /**
   * Reorder all items from this order.
   * Uses the cart service's `add()` method.
   * Opens the cart drawer after adding items.
   */
  reorder(items: any[]): void {
    // Add each item to the cart
    items.forEach(item => {
      // `add(id, qty)` is the correct method signature
      this.cart.add(item.product_id, item.quantity);
    });
    // Optionally navigate to cart page if you have one, or just keep the drawer open
    // If you have a cart page route, uncomment:
    // this.router.navigate(['/cart']);
    // Otherwise, the cart drawer is already opened by the `add` method.
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}