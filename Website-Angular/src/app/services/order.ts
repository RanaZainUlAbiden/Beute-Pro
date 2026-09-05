import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
}

export interface CreateOrderResponse {
  success: boolean;
  order: Order;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Create a new order
   * POST /api/orders
   */
  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    // Backend expects: email, phone, name, address, items, paymentMethod
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
   * Get a single order by ID (admin only)
   * GET /api/admin/orders/:id
   */
  getOrderById(orderId: number): Observable<{ order: Order }> {
    return this.http.get<{ order: Order }>(`${this.apiUrl}/admin/orders/${orderId}`);
  }
}