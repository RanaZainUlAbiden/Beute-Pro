import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ============================================================
// TYPES
// ============================================================
export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  is_admin: boolean;
  created_at: string;
  order_count: number;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserListFilters {
  search?: string;
  role?: 'admin' | 'customer';
  sortBy?: 'full_name' | 'email' | 'created_at' | 'order_count';
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================================
// SERVICE
// ============================================================
@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** GET /api/admin/users */
  list(filters: UserListFilters = {}): Observable<UserListResponse> {
    let params = new HttpParams();
    if (filters.search)  params = params.set('search', filters.search);
    if (filters.role)    params = params.set('role', filters.role);
    if (filters.sortBy)  params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
    if (filters.page)    params = params.set('page', String(filters.page));
    if (filters.limit)   params = params.set('limit', String(filters.limit));
    return this.http.get<UserListResponse>(`${this.apiUrl}/admin/users`, { params });
  }

  /** GET /api/admin/users/:id */
  getById(id: number): Observable<{ user: AdminUser }> {
    return this.http.get<{ user: AdminUser }>(`${this.apiUrl}/admin/users/${id}`);
  }

  /** PUT /api/admin/users/:id/role */
  setRole(id: number, isAdmin: boolean): Observable<{ success: boolean; user: AdminUser }> {
    return this.http.put<{ success: boolean; user: AdminUser }>(
      `${this.apiUrl}/admin/users/${id}/role`,
      { is_admin: isAdmin }
    );
  }
}