import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface TopProduct {
  product_id: string;
  revenue: string;
}

interface RevenueData {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  topProducts: TopProduct[];
}

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="revenue-page">
      <h1 class="h-lg">Revenue</h1>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ revenue.totalRevenue | currency:'PKR' }}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ revenue.todayRevenue | currency:'PKR' }}</div>
          <div class="stat-label">Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ revenue.monthRevenue | currency:'PKR' }}</div>
          <div class="stat-label">This Month</div>
        </div>
      </div>
      <div class="top-products">
        <h2>Top Products</h2>
        <div *ngFor="let p of revenue.topProducts" class="product-row">
          <span>{{ p.product_id }}</span>
          <span>{{ p.revenue | currency:'PKR' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .revenue-page { padding: 1rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap:1.5rem; margin: 2rem 0; }
    .stat-card { background: white; padding: 1.5rem; border-radius: var(--r-lg); box-shadow: var(--shadow); }
    .stat-value { font-size: 2rem; font-weight: 800; color: var(--green); }
    .stat-label { font-size: 0.8rem; color: var(--green-soft); }
    .top-products { background: white; padding: 1.5rem; border-radius: var(--r-lg); box-shadow: var(--shadow); }
    .product-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--ivory-3); }
    .product-row:last-child { border-bottom: none; }
  `],
})
export class RevenueComponent implements OnInit {
  private http = inject(HttpClient);
  
  revenue: RevenueData = {
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    topProducts: [],
  };

  ngOnInit() {
    this.http.get<RevenueData>(`${environment.apiUrl}/admin/revenue`).subscribe({
      next: (data) => {
        this.revenue = data;
      },
      error: (err) => {
        console.error('Failed to load revenue:', err);
      },
    });
  }
}