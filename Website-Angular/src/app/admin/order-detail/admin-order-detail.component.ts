import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <h1 class="h-lg">Order Detail</h1>
    <div *ngIf="order" class="detail-card">
      <div class="detail-row"><strong>Order #</strong> {{ order.order_number }}</div>
      <div class="detail-row"><strong>Customer</strong> {{ order.customer_name }} ({{ order.customer_email }})</div>
      <div class="detail-row"><strong>Address</strong> {{ order.shipping_address }}</div>
      <div class="detail-row"><strong>Total</strong> {{ order.total_amount_pkr | currency:'PKR' }}</div>
      <div class="detail-row"><strong>Status</strong>
        <select [(ngModel)]="selectedStatus" (change)="updateStatus()">
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div class="detail-row"><strong>Tracking</strong>
        <input [(ngModel)]="trackingNumber" placeholder="Tracking #" />
        <input [(ngModel)]="courierName" placeholder="Courier" />
        <button (click)="updateTracking()">Update</button>
      </div>
      <div class="items">
        <h3>Items</h3>
        <div *ngFor="let item of order.items" class="item-row">
          <span>{{ item.product_id }}</span>
          <span>{{ item.quantity }} × {{ item.unit_price_pkr | currency:'PKR' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-card { background: white; padding: 2rem; border-radius: var(--r-lg); box-shadow: var(--shadow); }
    .detail-row { display: flex; gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid var(--ivory-3); }
    .detail-row strong { width: 120px; }
    select, input { padding: 0.3rem 0.6rem; border-radius: var(--r); border: 1px solid var(--ivory-3); }
    .items { margin-top: 2rem; }
    .item-row { display: flex; justify-content: space-between; padding: 0.3rem 0; border-bottom: 1px solid var(--ivory-2); }
  `],
})
export class AdminOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  order: any;
  selectedStatus = '';
  trackingNumber = '';
  courierName = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get(`${environment.apiUrl}/admin/orders/${id}`).subscribe((data: any) => {
      this.order = data.order;
      this.selectedStatus = this.order.status;
      this.trackingNumber = this.order.tracking_number || '';
      this.courierName = this.order.courier_name || '';
    });
  }

  updateStatus() {
    const id = this.order.id;
    this.http.put(`${environment.apiUrl}/admin/orders/${id}/status`, { status: this.selectedStatus }).subscribe(() => {
      this.order.status = this.selectedStatus;
    });
  }

  updateTracking() {
    const id = this.order.id;
    this.http.put(`${environment.apiUrl}/admin/orders/${id}/tracking`, {
      trackingNumber: this.trackingNumber,
      courierName: this.courierName,
    }).subscribe(() => {
      this.order.tracking_number = this.trackingNumber;
      this.order.courier_name = this.courierName;
    });
  }
}
