import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiProduct,
  ProductListResponse,
  ProductFilters,
  ProductCreatePayload,
  ProductUpdatePayload,
} from '../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ============================================================
  // PUBLIC
  // ============================================================

  /** GET /api/products — public list (active only) */
  list(filters: ProductFilters = {}): Observable<ProductListResponse> {
    const params = this.buildParams(filters);
    return this.http.get<ProductListResponse>(`${this.apiUrl}/products`, { params });
  }

  /** GET /api/products/:id — public single */
  getById(id: string): Observable<{ product: ApiProduct }> {
    return this.http.get<{ product: ApiProduct }>(`${this.apiUrl}/products/${id}`);
  }

  // ============================================================
  // ADMIN
  // ============================================================

  /** GET /api/admin/products — admin list (includes inactive) */
  adminList(filters: ProductFilters = {}): Observable<ProductListResponse> {
    const params = this.buildParams(filters);
    return this.http.get<ProductListResponse>(`${this.apiUrl}/admin/products`, { params });
  }

  /** POST /api/admin/products */
  adminCreate(
    payload: ProductCreatePayload
  ): Observable<{ success: boolean; product: ApiProduct }> {
    return this.http.post<{ success: boolean; product: ApiProduct }>(
      `${this.apiUrl}/admin/products`,
      payload
    );
  }

  /** PUT /api/admin/products/:id */
  adminUpdate(
    id: string,
    payload: ProductUpdatePayload
  ): Observable<{ success: boolean; product: ApiProduct }> {
    return this.http.put<{ success: boolean; product: ApiProduct }>(
      `${this.apiUrl}/admin/products/${id}`,
      payload
    );
  }

  /** DELETE /api/admin/products/:id — soft by default; pass hard=true to purge */
  adminDelete(id: string, hard = false): Observable<{ success: boolean; message: string }> {
    const params = hard ? new HttpParams().set('hard', 'true') : undefined;
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/products/${id}`,
      { params }
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================
  private buildParams(filters: ProductFilters): HttpParams {
    let params = new HttpParams();
    if (filters.category) params = params.set('category', filters.category);
    if (filters.badge)    params = params.set('badge', filters.badge);
    if (filters.search)   params = params.set('search', filters.search);
    if (filters.page)     params = params.set('page', String(filters.page));
    if (filters.limit)    params = params.set('limit', String(filters.limit));
    return params;
  }
}