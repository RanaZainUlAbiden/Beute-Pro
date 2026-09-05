import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AdminApi, adminMoney, adminProductName, type RevenueData } from '../admin-api';
import { I18nService } from '../../core/services/i18n.service';

/* =============================================================
   REVENUE (admin)

   Three totals and the products behind them. The share column is
   worked out here rather than asked of the API: it is the one
   number that turns a list of amounts into a ranking you can act
   on, and the endpoint already sends everything it needs.
   ============================================================= */
@Component({
  selector: 'app-revenue',
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.scss',
})
export class RevenueComponent implements OnInit {
  private readonly api = inject(AdminApi);
  protected readonly i18n = inject(I18nService);

  protected readonly money = adminMoney;
  protected readonly productName = adminProductName;

  protected readonly data = signal<RevenueData | null>(null);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  /** Top products with their share of the top-product total. */
  protected readonly ranked = computed(() => {
    const products = this.data()?.topProducts ?? [];
    const sum = products.reduce((n, p) => n + parseFloat(p.revenue), 0);
    return products.map((p) => {
      const revenue = parseFloat(p.revenue);
      return {
        id: p.product_id,
        revenue,
        share: sum > 0 ? Math.round((revenue / sum) * 100) : 0,
      };
    });
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.revenue().subscribe({
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
