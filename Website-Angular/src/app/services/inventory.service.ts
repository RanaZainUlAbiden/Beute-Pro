import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiInventory, InventoryListResponse } from '../core/models/api.model';

export interface InventoryFilters {
  search?: string;
  lowStockOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ============================================================
  // PUBLIC
  // ============================================================

  /** GET /api/inventory/:productId — public stock lookup (used on PDP) */
  getByProductId(productId: string): Observable<{ inventory: ApiInventory }> {
    return this.http.get<{ inventory: ApiInventory }>(
      `${this.apiUrl}/inventory/${productId}`
    );
  }

  // ============================================================
  // ADMIN
  // ============================================================

  /** GET /api/admin/inventory */
  adminList(filters: InventoryFilters = {}): Observable<InventoryListResponse> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.lowStockOnly) params = params.set('lowStockOnly', 'true');
    return this.http.get<InventoryListResponse>(`${this.apiUrl}/admin/inventory`, { params });
  }

  /** GET /api/admin/inventory/low-stock */
  adminLowStock(): Observable<{ items: any[] }> {
    return this.http.get<{ items: any[] }>(`${this.apiUrl}/admin/inventory/low-stock`);
  }

  /** PUT /api/admin/inventory/:productId — set absolute stock */
  adminSet(
    productId: string,
    quantity: number,
    lowStockThreshold?: number
  ): Observable<{ success: boolean; inventory: ApiInventory }> {
    return this.http.put<{ success: boolean; inventory: ApiInventory }>(
      `${this.apiUrl}/admin/inventory/${productId}`,
      { quantity, lowStockThreshold }
    );
  }
}