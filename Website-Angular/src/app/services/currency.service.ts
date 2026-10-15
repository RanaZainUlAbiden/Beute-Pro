import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RatesResponse {
  base: string;
  rates: Record<string, number>;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** GET /api/rates — public, returns all target rates keyed by currency code. */
  getRates(): Observable<RatesResponse> {
    return this.http.get<RatesResponse>(`${this.apiUrl}/rates`);
  }

  /** POST /api/admin/rates/refresh — pull fresh rates from the provider. */
  refresh(): Observable<{ success: boolean; message: string; rates: Record<string, number> | null }> {
    return this.http.post<{ success: boolean; message: string; rates: Record<string, number> | null }>(
      `${this.apiUrl}/admin/rates/refresh`,
      {}
    );
  }

  /**
   * PUT /api/admin/rates/:currency — manual override for a single currency.
   * ⚠️ Requires a small backend addition (see notes in this file's companion block).
   */
  setRate(currency: string, rate: number): Observable<{ success: boolean; rate: number; updatedAt: string }> {
    return this.http.put<{ success: boolean; rate: number; updatedAt: string }>(
      `${this.apiUrl}/admin/rates/${currency}`,
      { rate }
    );
  }
}