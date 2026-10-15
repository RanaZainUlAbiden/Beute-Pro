import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ============================================================
// TYPES
// ============================================================

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: string;
  product_name_snapshot: string | null;
  quantity: number;
  unit_price_pkr: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_email: string;
  customer_phone: string;
  customer_name: string;
  shipping_address: string;
  total_amount_pkr: string;
  // ✅ Coupon (Phase 5B)
  coupon_code: string | null;
  discount_amount: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: string;
  tracking_number: string | null;
  courier_name: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrdersResponse {
  orders: Order[];
}

export interface CreateOrderPayload {
  email: string;
  phone: string;
  name: string;
  address: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: string;
  /** ✅ Optional — applied coupon code from checkout. */
  couponCode?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order: Order;
}

// ✅ Bulk action response shape (from backend adminBulkUpdateStatus/Tracking)
export interface BulkUpdateResponse {
  success: boolean;
  updated: number;
  requested: number;
  orders: Array<Partial<Order>>;
}

// ============================================================
// SERVICE
// ============================================================

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ------------------------------------------------------------
  // Customer-facing
  // ------------------------------------------------------------

  /**
   * Create a new order
   * POST /api/orders
   */
  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.apiUrl}/orders`, payload);
  }

  /**
   * Get all orders for the logged-in user
   * GET /api/orders/my
   */
  getMyOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(`${this.apiUrl}/orders/my`);
  }

  /**
   * Get a single order by order number (public tracking)
   * GET /api/orders/track/:orderNumber
   */
  getOrderByNumber(orderNumber: string): Observable<{ order: Order }> {
    return this.http.get<{ order: Order }>(`${this.apiUrl}/orders/track/${orderNumber}`);
  }

  /**
   * Get a single order by ID (admin)
   * GET /api/admin/orders/:id
   */
  getOrderById(orderId: number): Observable<{ order: Order }> {
    return this.http.get<{ order: Order }>(`${this.apiUrl}/admin/orders/${orderId}`);
  }

  // ------------------------------------------------------------
  // ✅ Admin — bulk actions (Phase 5C)
  // ------------------------------------------------------------

  /**
   * Bulk update order statuses
   * PUT /api/admin/orders/bulk/status
   * Body: { orderIds: number[], status: string, adminNotes?: string }
   */
  bulkUpdateStatus(
    orderIds: number[],
    status: Order['status'],
    adminNotes?: string
  ): Observable<BulkUpdateResponse> {
    return this.http.put<BulkUpdateResponse>(
      `${this.apiUrl}/admin/orders/bulk/status`,
      {
        orderIds,
        status,
        ...(adminNotes ? { adminNotes } : {}),
      }
    );
  }

  /**
   * Bulk update tracking info
   * PUT /api/admin/orders/bulk/tracking
   * Body: { orderIds: number[], trackingNumber: string, courierName: string }
   */
  bulkUpdateTracking(
    orderIds: number[],
    trackingNumber: string,
    courierName: string
  ): Observable<BulkUpdateResponse> {
    return this.http.put<BulkUpdateResponse>(
      `${this.apiUrl}/admin/orders/bulk/tracking`,
      { orderIds, trackingNumber, courierName }
    );
  }

  // ------------------------------------------------------------
  // ✅ Admin — single order actions
  // ------------------------------------------------------------

  /**
   * Update a single order's status
   * PUT /api/admin/orders/:id/status
   */
  updateStatus(
    orderId: number,
    status: Order['status'],
    adminNotes?: string
  ): Observable<{ order: Order }> {
    return this.http.put<{ order: Order }>(
      `${this.apiUrl}/admin/orders/${orderId}/status`,
      { status, adminNotes }
    );
  }

  /**
   * Update a single order's tracking info
   * PUT /api/admin/orders/:id/tracking
   */
  updateTracking(
    orderId: number,
    trackingNumber: string,
    courierName: string
  ): Observable<{ order: Order }> {
    return this.http.put<{ order: Order }>(
      `${this.apiUrl}/admin/orders/${orderId}/tracking`,
      { trackingNumber, courierName }
    );
  }
}