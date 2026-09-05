import { Injectable, inject, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { WishlistService } from './wishlist'; // ✅ Import

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  is_admin: boolean;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  private tokenKey = 'beute_token';
  private userKey = 'beute_user';

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private isBrowser: boolean;

  // ✅ Inject WishlistService
  private wishlist = inject(WishlistService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadStoredUser();
    }
  }

  private loadStoredUser(): void {
    if (!this.isBrowser) return;
    const token = localStorage.getItem(this.tokenKey);
    const userJson = localStorage.getItem(this.userKey);
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.userSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }

  register(data: { email: string; password: string; full_name: string; phone?: string; address?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  private handleAuthResponse(res: AuthResponse): void {
    if (!this.isBrowser) return;
    if (res.success && res.token) {
      localStorage.setItem(this.tokenKey, res.token);
      localStorage.setItem(this.userKey, JSON.stringify(res.user));
      this.userSubject.next(res.user);
      // ✅ Load wishlist after successful login/register
      this.wishlist.loadWishlist().subscribe({
        error: (err) => console.warn('Failed to load wishlist after login', err),
      });
    }
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`);
  }

  updateProfile(data: { full_name?: string; phone?: string; address?: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/me`, data).pipe(
      tap(user => {
        if (!this.isBrowser) return;
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.userSubject.next(user);
      })
    );
  }

  logout(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.userSubject.value;
    return user?.is_admin === true;
  }

  loginWithGoogle(): void {
    if (!this.isBrowser) return;
    window.location.href = environment.googleAuthUrl;
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.apiUrl}/users/me/password`,
      { currentPassword, newPassword, confirmPassword: newPassword }
    );
  }
}