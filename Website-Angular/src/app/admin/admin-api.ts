import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';

import { CURRENCY, PRODUCTS } from '../core/data/products';
import type { Order } from '../services/order';
import { environment } from '../../environments/environment';

/* =============================================================
   ADMIN API

   One place for the six admin endpoints and the shapes they
   answer with, so the screens hold state and markup only.

   The shapes below are the backend's, verbatim — including the
   fact that /admin/dashboard answers in camelCase while
   /admin/orders answers in the database's snake_case.
   ============================================================= */

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalCustomers: number;
  newCustomers: number;
}

export interface RecentOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  ordersByStatus: { status: string; count: string }[];
  dailyRevenue: { date: string; revenue: number }[];
  topProducts: { productId: string; totalQuantity: number; revenue: number }[];
  recentOrders: RecentOrder[];
}

export interface AdminOrdersPage {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RevenueData {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  topProducts: { product_id: string; revenue: string }[];
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
}

export interface ContactPage {
  messages: ContactMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  order_count: number;
}

export interface CustomerPage {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerEdits {
  full_name: string;
  email: string;
  phone: string;
  address: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  dashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.url}/admin/dashboard`);
  }

  orders(page: number, limit: number, status?: string): Observable<AdminOrdersPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<AdminOrdersPage>(`${this.url}/admin/orders`, { params });
  }

  order(id: number | string): Observable<{ order: Order }> {
    return this.http.get<{ order: Order }>(`${this.url}/admin/orders/${id}`);
  }

  setStatus(id: number, status: string): Observable<{ order: Order }> {
    return this.http.put<{ order: Order }>(`${this.url}/admin/orders/${id}/status`, { status });
  }

  setTracking(id: number, trackingNumber: string, courierName: string): Observable<{ order: Order }> {
    return this.http.put<{ order: Order }>(`${this.url}/admin/orders/${id}/tracking`, {
      trackingNumber,
      courierName,
    });
  }

  revenue(): Observable<RevenueData> {
    return this.http.get<RevenueData>(`${this.url}/admin/revenue`);
  }

  messages(page: number, limit: number, status?: string): Observable<ContactPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<ContactPage>(`${this.url}/admin/contact`, { params });
  }

  setMessageStatus(id: number, status: string): Observable<unknown> {
    return this.http.put(`${this.url}/admin/contact/${id}/status`, { status });
  }

  deleteMessage(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/admin/contact/${id}`);
  }

  customers(
    page: number,
    limit: number,
    search?: string,
    sortBy?: string,
    sortDir?: 'asc' | 'desc',
  ): Observable<CustomerPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDir) params = params.set('sortDir', sortDir);
    return this.http.get<CustomerPage>(`${this.url}/admin/customers`, { params });
  }

  updateCustomer(id: number, edits: CustomerEdits): Observable<{ customer: Customer }> {
    return this.http.put<{ customer: Customer }>(`${this.url}/admin/customers/${id}`, edits);
  }

  deleteCustomer(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/admin/customers/${id}`);
  }
}

/* ---- admin-only formatting -------------------------------------
   The storefront's money() follows the visitor's language and would
   render Arabic numerals in an Arabic session. The admin panel is
   English and its numbers are compared column to column, so it
   formats its own — grouped, no decimals, tabular. */
export function adminMoney(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (!isFinite(n)) return `${CURRENCY.symbol} 0`;
  return `${CURRENCY.symbol} ${Math.round(n).toLocaleString('en-US')}`;
}

export function adminDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** Catalogue name for a product id, falling back to the id itself. */
export function adminProductName(id: string): string {
  return PRODUCTS.find((p) => p.id === id)?.en.name ?? id;
}
