import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private wishlistSubject = new BehaviorSubject<string[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  /**
   * Load wishlist from server
   */
  loadWishlist(): Observable<{ items: string[] }> {
    return this.http.get<{ items: string[] }>(`${this.apiUrl}/wishlist`).pipe(
      tap(res => this.wishlistSubject.next(res.items))
    );
  }

  /**
   * Get current wishlist value
   */
  getWishlist(): string[] {
    return this.wishlistSubject.value;
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
          const current = this.wishlistSubject.value;
          this.wishlistSubject.next([...current, productId]);
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
          const current = this.wishlistSubject.value;
          this.wishlistSubject.next(current.filter(id => id !== productId));
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
    const current = this.wishlistSubject.value;
    const exists = current.includes(productId);
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
    return this.wishlistSubject.value.includes(productId);
  }
}