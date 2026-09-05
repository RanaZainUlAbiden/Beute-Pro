import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminApi, adminDate, adminMoney, type DashboardData } from '../admin-api';
import { statusPill, statusKey } from '../../features/orders/order-view';
import { I18nService } from '../../core/services/i18n.service';

/* =============================================================
   DASHBOARD

   What an owner needs at a glance: today's revenue against the
   all-time total, order volume and how much of it is still
   waiting to ship, and the most recent orders. Everything is a
   link into the screen that can act on it — the dashboard itself
   does nothing but show.
   ============================================================= */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(AdminApi);
  protected readonly i18n = inject(I18nService);

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  protected readonly money = adminMoney;
  protected readonly date = adminDate;
  protected readonly pill = statusPill;
  protected readonly statusLabel = (status: string) => this.i18n.t(statusKey(status));

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
}
