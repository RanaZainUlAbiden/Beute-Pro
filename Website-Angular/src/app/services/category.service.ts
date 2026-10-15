import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiCategory,
  CategoryListResponse,
  CategoryCreatePayload,
  CategoryUpdatePayload,
} from '../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ============================================================
  // PUBLIC
  // ============================================================

  /** GET /api/categories */
  list(): Observable<CategoryListResponse> {
    return this.http.get<CategoryListResponse>(`${this.apiUrl}/categories`);
  }

  /** GET /api/categories/:id */
  getById(id: string): Observable<{ category: ApiCategory }> {
    return this.http.get<{ category: ApiCategory }>(`${this.apiUrl}/categories/${id}`);
  }

  // ============================================================
  // ADMIN
  // ============================================================

  /** POST /api/admin/categories */
  adminCreate(
    payload: CategoryCreatePayload
  ): Observable<{ success: boolean; category: ApiCategory }> {
    return this.http.post<{ success: boolean; category: ApiCategory }>(
      `${this.apiUrl}/admin/categories`,
      payload
    );
  }

  /** PUT /api/admin/categories/:id */
  adminUpdate(
    id: string,
    payload: CategoryUpdatePayload
  ): Observable<{ success: boolean; category: ApiCategory }> {
    return this.http.put<{ success: boolean; category: ApiCategory }>(
      `${this.apiUrl}/admin/categories/${id}`,
      payload
    );
  }

  /** DELETE /api/admin/categories/:id */
  adminDelete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/categories/${id}`
    );
  }
}