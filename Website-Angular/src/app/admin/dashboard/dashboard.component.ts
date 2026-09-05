import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1 class="h-lg">Dashboard</h1>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">{{ summary.totalOrders }}</div><div class="stat-label">Total Orders</div></div>
        <div class="stat-card"><div class="stat-value">{{ summary.totalRevenue | currency:'PKR' }}</div><div class="stat-label">Revenue</div></div>
        <div class="stat-card"><div class="stat-value">{{ summary.todayRevenue | currency:'PKR' }}</div><div class="stat-label">Today</div></div>
        <div class="stat-card"><div class="stat-value">{{ summary.totalCustomers }}</div><div class="stat-label">Customers</div></div>
      </div>
      <div class="recent-orders">
        <h2>Recent Orders</h2>
        <div class="order-list">
          <div *ngFor="let order of recentOrders" class="order-row">
            <span>{{ order.orderNumber }}</span>
            <span>{{ order.customerName }}</span>
            <span>{{ order.total | currency:'PKR' }}</span>
            <span class="status-badge" [class]="'status-'+order.status">{{ order.status }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap:1.5rem; margin: 2rem 0; }
    .stat-card { background: white; padding: 1.5rem; border-radius: var(--r-lg); box-shadow: var(--shadow); }
    .stat-value { font-size: 2rem; font-weight: 800; color: var(--green); }
    .stat-label { font-size: 0.8rem; color: var(--green-soft); }
    .recent-orders { background: white; border-radius: var(--r-lg); padding: 1.5rem; }
    .order-row { display: grid; grid-template-columns: 1fr 2fr 1fr 1fr; gap:1rem; padding:0.5rem 0; border-bottom:1px solid var(--ivory-3); }
    .status-badge { padding: 0.2rem 0.6rem; border-radius: var(--r); font-size: 0.7rem; font-weight:700; text-transform:capitalize; }
    .status-pending { background: #fef3c7; color:#b45309; }
    .status-processing { background: #dbeafe; color:#1e40af; }
    .status-shipped { background: #d1fae5; color:#065f46; }
    .status-delivered { background: var(--green-2); color:var(--ivory); }
    .status-cancelled { background: #fde8e6; color:#a8443c; }
  `],
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  summary = { totalOrders: 0, totalRevenue: 0, todayRevenue: 0, totalCustomers: 0 };
  recentOrders: any[] = [];

  ngOnInit() {
    this.http.get(`${environment.apiUrl}/admin/dashboard`).subscribe((data: any) => {
      this.summary = data.summary;
      this.recentOrders = data.recentOrders;
    });
  }
}
