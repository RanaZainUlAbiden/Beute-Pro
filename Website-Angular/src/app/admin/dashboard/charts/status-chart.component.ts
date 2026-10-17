import { I18nService } from '../../../core/services/i18n.service';
import { Component, Input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface OrderStatusCount {
  status: string;
  count: string | number;
}

const STATUS_COLORS: Record<string, string> = {
  pending:     '#E4C783',  // gold light
  processing:  '#5C7A68',  // green soft
  shipped:     '#2C6045',  // green 3
  delivered:   '#0F2A1D',  // green
  cancelled:   '#A8443C',  // red
};

const STATUS_LABELS: Record<string, import('../../../core/data/i18n.data').TranslationKey> = {
  pending:    'admin.payment.status.pending',
  processing: 'admin.common.processing',
  shipped:    'admin.common.shipped',
  delivered:  'admin.common.delivered',
  cancelled:  'admin.common.cancelled',
};

@Component({
  selector: 'app-status-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-card">
      <div class="chart-head">
        <div>
          <h3 class="chart-title">{{ i18n.t('admin.dashboard.chart.orderStatus') }}</h3>
          <p class="chart-sub">
            {{ i18n.t('admin.dashboard.chart.totalOrders').replace('{count}', totalOrders().toString()) }}
          </p>
        </div>
      </div>

      <div class="chart-content" *ngIf="hasData(); else noData">
        <div class="doughnut-wrap">
          <canvas
            baseChart
            [type]="chartType"
            [data]="chartData()"
            [options]="chartOptions"
          ></canvas>
        </div>

        <!-- Custom legend -->
        <ul class="legend-list">
          <li *ngFor="let row of legendRows()" class="legend-row">
            <span class="legend-dot" [style.background]="row.color"></span>
            <span class="legend-label">{{ row.label }}</span>
            <span class="legend-count">{{ row.count }}</span>
            <span class="legend-pct">{{ row.pct }}%</span>
          </li>
        </ul>
      </div>

      <ng-template #noData>
        <div class="chart-empty">{{ i18n.t('admin.dashboard.chart.noOrdersYet') }}</div>
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

    .chart-content {
      flex: 1;
      display: grid;
      grid-template-columns: minmax(140px, 1fr) 1.2fr;
      gap: 1.25rem;
      align-items: center;
    }

    .doughnut-wrap {
      position: relative;
      aspect-ratio: 1;
      max-width: 200px;
      margin: 0 auto;
      width: 100%;
    }

    .legend-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .legend-row {
      display: grid;
      grid-template-columns: 12px 1fr auto auto;
      gap: 0.6rem;
      align-items: center;
      font-size: 0.82rem;
    }
    .legend-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label {
      color: var(--ink, #132018);
      font-weight: 600;
    }
    .legend-count {
      color: var(--green, #0F2A1D);
      font-weight: 800;
      min-width: 24px;
      text-align: right;
    }
    .legend-pct {
      color: var(--green-soft, #5C7A68);
      font-size: 0.76rem;
      font-weight: 600;
      min-width: 34px;
      text-align: right;
    }

    .chart-empty {
      flex: 1;
      display: grid; place-items: center;
      color: var(--green-soft, #5C7A68);
      font-size: 0.88rem;
    }

    @media (max-width: 520px) {
      .chart-content {
        grid-template-columns: 1fr;
      }
      .doughnut-wrap { max-width: 160px; }
    }
  `],
})
export class StatusChartComponent {
  protected readonly i18n = inject(I18nService);
  private readonly _data = signal<OrderStatusCount[]>([]);

  @Input()
  set data(value: OrderStatusCount[] | null | undefined) {
    this._data.set(value ?? []);
  }
  get data(): OrderStatusCount[] {
    return this._data();
  }

  readonly chartType = 'doughnut' as const;

  totalOrders = computed(() =>
    this._data().reduce((sum, r) => sum + Number(r.count), 0)
  );

  hasData = computed(() => this.totalOrders() > 0);

  chartData = computed<ChartData<'doughnut'>>(() => {
    const items = this._data();
    return {
      labels: items.map((r) => STATUS_LABELS[r.status] ? this.i18n.t(STATUS_LABELS[r.status]) : r.status),
      datasets: [
        {
          data: items.map((r) => Number(r.count)),
          backgroundColor: items.map((r) => STATUS_COLORS[r.status] || '#5C7A68'),
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    };
  });

  legendRows = computed(() => {
    const items = this._data();
    const total = this.totalOrders() || 1;
    return items.map((r) => {
      const count = Number(r.count);
      return {
        label: STATUS_LABELS[r.status] ? this.i18n.t(STATUS_LABELS[r.status]) : r.status,
        color: STATUS_COLORS[r.status] || '#5C7A68',
        count,
        pct: Math.round((count / total) * 100),
      };
    });
  });

  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '62%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F2A1D',
        padding: 12,
        titleColor: '#F7F4EC',
        bodyColor: '#F7F4EC',
        borderColor: '#C9A44C',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || '';
            const val = Number(ctx.parsed);
            return `${label}: ${this.i18n.t('admin.dashboard.chart.orderCount').replace('{count}', val.toString())}`;
          },
        },
      },
    },
  };
}