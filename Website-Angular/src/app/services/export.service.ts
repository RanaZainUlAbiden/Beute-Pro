import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type ExportType = 'orders' | 'products' | 'customers';

export interface OrderExportFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Download a CSV for the given resource.
   * Triggers a browser download by creating a temporary object URL.
   */
  download(type: ExportType, filters: OrderExportFilters = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.status)    params = params.set('status', filters.status);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate)   params = params.set('endDate', filters.endDate);

    return this.http
      .get(`${this.apiUrl}/admin/export/${type}.csv`, {
        params,
        responseType: 'blob',
      })
      .pipe(
        tap((blob) => this.triggerDownload(blob, `${type}_${this.timestamp()}.csv`))
      );
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private timestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }
}