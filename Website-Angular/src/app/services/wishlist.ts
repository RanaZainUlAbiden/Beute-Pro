import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private readonly ids = signal<readonly string[]>([]);
  /** Saved product ids, as a signal — reactive for OnPush components and effects. */
  readonly items = this.ids.asReadonly();

  constructor() {
    // AuthService has finished restoring its session before this subscription
    // can issue HTTP requests through the auth interceptor.
    this.auth.user$.pipe(
      map((user) => user?.id ?? null),
      distinctUntilChanged(),
      switchMap((userId) => {
        this.clear();
        if (userId === null) return EMPTY;
        return this.loadWishlist().pipe(
          catchError((error) => {
            console.warn('Failed to load wishlist after session change', error);
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe();
  }

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
