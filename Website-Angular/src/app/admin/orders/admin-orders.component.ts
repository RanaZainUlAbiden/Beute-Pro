import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <h1 class="h-lg">Orders</h1>
    <div class="filters">
      <select (change)="filterStatus($event)" class="filter-select">
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
    <div class="order-table">
      <div class="table-header">
        <span>Order #</span>
        <span>Customer</span>
        <span>Total</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      <div *ngFor="let order of orders" class="table-row">
        <span>{{ order.order_number }}</span>
        <span>{{ order.customer_name }}</span>
        <span>{{ order.total_amount_pkr | currency:'PKR' }}</span>
        <span class="status-badge" [class]="'status-'+order.status">{{ order.status }}</span>
        <!-- ✅ Fixed routerLink: navigate to './' + order.id (same level, not up) -->
        <a [routerLink]="[order.id]" class="btn-link">View</a>
      </div>
    </div>
  `,
  styles: [`
    .filters { margin-bottom: 1.5rem; }
    .filter-select { padding: 0.5rem 1rem; border-radius: var(--r); border:1px solid var(--ivory-3); background: white; }
    .order-table { background: white; border-radius: var(--r-lg); overflow: hidden; box-shadow: var(--shadow); }
    .table-header, .table-row { display: grid; grid-template-columns: 1fr 2fr 1fr 1fr 1fr; gap: 1rem; padding: 0.8rem 1.5rem; align-items: center; }
    .table-header { background: var(--green); color: var(--ivory); font-weight: 700; }
    .table-row { border-bottom: 1px solid var(--ivory-3); }
    .btn-link { color: var(--gold); font-weight: 600; text-decoration: underline; }
    .status-badge { padding: 0.2rem 0.6rem; border-radius: var(--r); font-size: 0.7rem; font-weight:700; text-transform:capitalize; }
    .status-pending { background: #fef3c7; color:#b45309; }
    .status-processing { background: #dbeafe; color:#1e40af; }
    .status-shipped { background: #d1fae5; color:#065f46; }
    .status-delivered { background: var(--green-2); color:var(--ivory); }
    .status-cancelled { background: #fde8e6; color:#a8443c; }
  `],
})
export class AdminOrdersComponent implements OnInit {
  private http = inject(HttpClient);
  orders: any[] = [];

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders(status?: string) {
    const url = `${environment.apiUrl}/admin/orders${status ? '?status='+status : ''}`;
    this.http.get(url).subscribe((data: any) => {
      this.orders = data.orders;
    });
  }

  filterStatus(event: any) {
    this.loadOrders(event.target.value || undefined);
  }
}