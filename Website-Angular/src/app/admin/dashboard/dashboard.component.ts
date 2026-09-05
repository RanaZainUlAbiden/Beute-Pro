import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminApi, adminDate, adminMoney, adminProductName, type DashboardData } from '../admin-api';
import { statusPill } from '../../features/orders/order-view';

/* =============================================================
   DASHBOARD

   The answer to "what happened while I was away", in one screen:
   the five totals, where the open orders are sitting, the last
   seven days of takings, the five most recent orders and the top
   products. Everything is a link into the screen that can act
   on it — the dashboard itself does nothing but show.
   ============================================================= */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(AdminApi);

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  protected readonly money = adminMoney;
  protected readonly date = adminDate;
  protected readonly productName = adminProductName;
  protected readonly pill = statusPill;

  /** The tallest bar sets the scale for the seven-day strip. */
  protected readonly peak = computed(() =>
    Math.max(1, ...(this.data()?.dailyRevenue ?? []).map((d) => d.revenue)),
  );

  protected readonly openOrders = computed(() =>
    (this.data()?.ordersByStatus ?? [])
      .filter((r) => r.status === 'pending' || r.status === 'processing')
      .reduce((n, r) => n + Number(r.count), 0),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.dashboard().subscribe({
      next: (data) => {
        this.data.set(data);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }

  protected barHeight(revenue: number): string {
    return `${Math.max(4, Math.round((revenue / this.peak()) * 100))}%`;
  }

  protected weekday(value: string): string {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { weekday: 'short' });
  }
}
