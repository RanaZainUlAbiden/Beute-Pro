import { I18nService } from '../../../core/services/i18n.service';
import { Component, Input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface DailyRevenuePoint {
  date: string;      // ISO date
  revenue: number;   // PKR
}

@Component({
  selector: 'app-sales-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-card">
      <div class="chart-head">
        <div>
          <h3 class="chart-title">{{ i18n.t('admin.dashboard.chart.revenueLast7Days') }}</h3>
          <p class="chart-sub">
            {{ i18n.t('admin.dashboard.chart.total') }} <b>₨ {{ totalRevenue() | number }}</b>
          </p>
        </div>
        <div class="chart-legend">
          <span class="legend-dot"></span>
          <span class="legend-label">{{ i18n.t('admin.dashboard.chart.dailyRevenue') }}</span>
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
        <div class="chart-empty">{{ i18n.t('admin.dashboard.chart.noRevenueDataForThisPeriod') }}</div>
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
      gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
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
    .chart-sub b { color: var(--gold, #C9A44C); font-weight: 800; }

    .chart-legend {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--green-soft, #5C7A68);
    }
    .legend-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: var(--gold, #C9A44C);
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
export class SalesChartComponent {
  protected readonly i18n = inject(I18nService);
  private readonly _data = signal<DailyRevenuePoint[]>([]);

  /** Input as a plain array — parent passes the daily revenue from the dashboard API. */
  @Input()
  set data(value: DailyRevenuePoint[] | null | undefined) {
    this._data.set(value ?? []);
  }
  get data(): DailyRevenuePoint[] {
    return this._data();
  }

  readonly chartType = 'line' as const;

  totalRevenue = computed(() =>
    this._data().reduce((sum, d) => sum + d.revenue, 0)
  );

  hasData = computed(() =>
    this._data().some((d) => d.revenue > 0)
  );

  /** Turn the last-7-days array into the shape Chart.js wants. */
  chartData = computed<ChartData<'line'>>(() => {
    const points = this._data();
    return {
      labels: points.map((p) => this.formatDay(p.date)),
      datasets: [
        {
          label: this.i18n.t('admin.dashboard.chart.revenuePkr'),
          data: points.map((p) => p.revenue),
          borderColor: '#C9A44C',
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return 'rgba(201, 164, 76, 0.1)';
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(201, 164, 76, 0.35)');
            gradient.addColorStop(1, 'rgba(201, 164, 76, 0)');
            return gradient;
          },
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#0F2A1D',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  });

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
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
          label: (ctx) => `₨ ${Number(ctx.parsed.y).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#5C7A68',
          font: { size: 11, weight: 600 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 219, 201, 0.5)' },
        border: { display: false },
        ticks: {
          color: '#5C7A68',
          font: { size: 11, weight: 600 },
          callback: (v) => '₨ ' + Number(v).toLocaleString(),
        },
      },
    },
  };

  private formatDay(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
}