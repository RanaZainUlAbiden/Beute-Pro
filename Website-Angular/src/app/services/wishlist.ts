import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private readonly ids = signal<readonly string[]>([]);
  /** Saved product ids, as a signal — reactive for OnPush components and effects. */
  readonly items = this.ids.asReadonly();

  /**
   * Load wishlist from server
   */
  loadWishlist(): Observable<{ items: string[] }> {
    return this.http.get<{ items: string[] }>(`${this.apiUrl}/wishlist`).pipe(
      tap(res => this.ids.set(res.items ?? []))
    );
  }

  /**
   * Get current wishlist value
   */
  getWishlist(): readonly string[] {
    return this.ids();
  }

  /**
   * Add product to wishlist
   */
  add(productId: string): Observable<{ success: boolean; added: boolean; alreadyExists: boolean }> {
    return this.http.post<{ success: boolean; added: boolean; alreadyExists: boolean }>(
      `${this.apiUrl}/wishlist/${productId}`,
      {}
    ).pipe(
      tap(res => {
        if (res.added) {
          this.ids.update(current => current.includes(productId) ? current : [...current, productId]);
        }
      })
    );
  }

  /**
   * Remove product from wishlist
   */
  remove(productId: string): Observable<{ success: boolean; removed: boolean }> {
    return this.http.delete<{ success: boolean; removed: boolean }>(
      `${this.apiUrl}/wishlist/${productId}`
    ).pipe(
      tap(res => {
        if (res.removed) {
          this.ids.update(current => current.filter(id => id !== productId));
        }
      })
    );
  }

  /**
   * Check if product is in wishlist
   */
  check(productId: string): Observable<{ inWishlist: boolean }> {
    return this.http.get<{ inWishlist: boolean }>(
      `${this.apiUrl}/wishlist/check/${productId}`
    );
  }

  /**
   * Toggle product in wishlist (add if not present, remove if present)
   */
  toggle(productId: string): Observable<{ added: boolean; removed: boolean }> {
    const exists = this.ids().includes(productId);
    if (exists) {
      return this.remove(productId).pipe(
        tap(() => ({ added: false, removed: true }))
      ) as any;
    } else {
      return this.add(productId).pipe(
        tap(() => ({ added: true, removed: false }))
      ) as any;
    }
  }

  /**
   * Check if product is in wishlist synchronously (from cached state)
   */
  isInWishlist(productId: string): boolean {
    return this.ids().includes(productId);
  }

  /** Drop all local state — call on logout so a signed-out session, or the
   *  next user to sign in, doesn't briefly see the previous user's hearts. */
  clear(): void {
    this.ids.set([]);
  }
}
