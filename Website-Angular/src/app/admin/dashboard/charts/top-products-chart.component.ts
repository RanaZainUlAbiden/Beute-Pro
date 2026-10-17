import { I18nService } from '../../../core/services/i18n.service';
import { Component, Input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface TopProduct {
  productId: string;
  totalQuantity: number;
  revenue: number;
}

@Component({
  selector: 'app-top-products-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-card">
      <div class="chart-head">
        <div>
          <h3 class="chart-title">{{ i18n.t('admin.dashboard.topProducts') }}</h3>
          <p class="chart-sub">{{ i18n.t('admin.dashboard.chart.byRevenueAllTime') }}</p>
        </div>
      </div>

      <div class="chart-body" *ngIf="hasData(); else noData">
        <canvas
          baseChart
          [type]="chartType"
          [data]="chartData()"
          [options]="chartOptions"
        ></canvas>
      </div>

      <ng-template #noData>
        <div class="chart-empty">{{ i18n.t('admin.dashboard.chart.noSalesYet') }}</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .chart-card {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 1.5rem 1.75rem 1.25rem;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.04);
      display: flex; flex-direction: column;
      height: 100%;
      min-height: 340px;
    }
    .chart-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; margin-bottom: 1.25rem;
    }
    .chart-title {
      margin: 0 0 0.2rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--green, #0F2A1D);
    }
    .chart-sub {
      margin: 0;
      font-size: 0.8rem;
      color: var(--green-soft, #5C7A68);
    }
    .chart-body {
      flex: 1;
      position: relative;
      min-height: 240px;
    }
    .chart-empty {
      flex: 1;
      display: grid; place-items: center;
      color: var(--green-soft, #5C7A68);
      font-size: 0.88rem;
    }
  `],
})
export class TopProductsChartComponent {
  protected readonly i18n = inject(I18nService);
  private readonly _data = signal<TopProduct[]>([]);

  @Input()
  set data(value: TopProduct[] | null | undefined) {
    this._data.set(value ?? []);
  }
  get data(): TopProduct[] {
    return this._data();
  }

  readonly chartType = 'bar' as const;

  hasData = computed(() => this._data().length > 0);

  chartData = computed<ChartData<'bar'>>(() => {
    const items = this._data();
    const labels = items.map((p) => this.prettifyId(p.productId));
    const revenues = items.map((p) => p.revenue);

    return {
      labels,
      datasets: [
        {
          label: this.i18n.t('admin.dashboard.chart.revenuePkr'),
          data: revenues,
          backgroundColor: [
            '#C9A44C',  // gold
            '#2C6045',  // green 3
            '#5C7A68',  // green soft
            '#E4C783',  // gold light
            '#17402C',  // green 2
          ],
          borderColor: 'transparent',
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 22,
        },
      ],
    };
  });

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F2A1D',
        padding: 12,
        titleColor: '#F7F4EC',
        bodyColor: '#F7F4EC',
        borderColor: '#C9A44C',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (ctx) => `₨ ${Number(ctx.parsed.x).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 219, 201, 0.5)' },
        border: { display: false },
        ticks: {
          color: '#5C7A68',
          font: { size: 11, weight: 600 },
          callback: (v) => '₨ ' + Number(v).toLocaleString(),
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#0F2A1D',
          font: { size: 11, weight: 700 },
        },
      },
    },
  };

  /** Turn "aloe-vera-mist" into "Aloe Vera Mist". */
  private prettifyId(id: string): string {
    return id
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}