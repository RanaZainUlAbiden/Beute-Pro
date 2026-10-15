import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SettingsResponse, StoreSettings } from '../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ============================================================
  // PUBLIC
  // ============================================================

  /**
   * GET /api/settings
   * Returns only safe, public-facing keys
   *   (free_shipping_min_pkr, cod_extra_charges_pkr, store_phone).
   */
  getPublic(): Observable<SettingsResponse> {
    return this.http.get<SettingsResponse>(`${this.apiUrl}/settings`);
  }

  // ============================================================
  // ADMIN
  // ============================================================

  /** GET /api/admin/settings — all keys (raw) */
  adminGetAll(): Observable<SettingsResponse> {
    return this.http.get<SettingsResponse>(`${this.apiUrl}/admin/settings`);
  }

  /** PUT /api/admin/settings — bulk upsert */
  adminSetMany(
    settings: StoreSettings
  ): Observable<{ success: boolean; settings: StoreSettings }> {
    return this.http.put<{ success: boolean; settings: StoreSettings }>(
      `${this.apiUrl}/admin/settings`,
      settings
    );
  }
}