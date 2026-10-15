import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiCoupon,
  CouponListResponse,
  CouponValidateResponse,
  CouponCreatePayload,
  CouponUpdatePayload,
} from '../core/models/api.model';

export interface CouponFilters {
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ============================================================
  // PUBLIC — used by checkout
  // ============================================================

  /** POST /api/coupons/validate */
  validate(code: string, orderTotal: number): Observable<CouponValidateResponse> {
    return this.http.post<CouponValidateResponse>(`${this.apiUrl}/coupons/validate`, {
      code,
      orderTotal,
    });
  }

  // ============================================================
  // ADMIN
  // ============================================================

  /** GET /api/admin/coupons */
  adminList(filters: CouponFilters = {}): Observable<CouponListResponse> {
    let params = new HttpParams();
    if (filters.activeOnly) params = params.set('activeOnly', 'true');
    if (filters.page)       params = params.set('page', String(filters.page));
    if (filters.limit)      params = params.set('limit', String(filters.limit));
    return this.http.get<CouponListResponse>(`${this.apiUrl}/admin/coupons`, { params });
  }

  /** POST /api/admin/coupons */
  adminCreate(
    payload: CouponCreatePayload
  ): Observable<{ success: boolean; coupon: ApiCoupon }> {
    return this.http.post<{ success: boolean; coupon: ApiCoupon }>(
      `${this.apiUrl}/admin/coupons`,
      payload
    );
  }

  /** PUT /api/admin/coupons/:code */
  adminUpdate(
    code: string,
    payload: CouponUpdatePayload
  ): Observable<{ success: boolean; coupon: ApiCoupon }> {
    return this.http.put<{ success: boolean; coupon: ApiCoupon }>(
      `${this.apiUrl}/admin/coupons/${code}`,
      payload
    );
  }

  /** DELETE /api/admin/coupons/:code */
  adminRemove(code: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/coupons/${code}`
    );
  }
}