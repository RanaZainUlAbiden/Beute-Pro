import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AdminCategoriesComponent } from './categories/admin-categories.component';
import { AdminProductsComponent } from './products/admin-products.component';
import { AdminInventoryComponent } from './inventory/admin-inventory.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminCouponsComponent } from './coupons/admin-coupons.component';
import { AdminExchangeRatesComponent } from './exchange-rates/admin-exchange-rates.component';
import { AdminSettingsComponent } from './settings/admin-settings.component';
import { AuthService } from '../services/auth';
import { ToastService } from '../core/services/toast.service';
import { environment } from '../../environments/environment';

const screens: { component: Type<unknown>; path: string; response: object }[] = [
  { component: AdminCategoriesComponent, path: '/categories', response: { categories: [] } },
  { component: AdminProductsComponent, path: '/admin/products', response: { products: [], total: 0 } },
  { component: AdminInventoryComponent, path: '/admin/inventory', response: { items: [] } },
  { component: AdminUsersComponent, path: '/admin/users', response: { users: [], total: 0 } },
  { component: AdminCouponsComponent, path: '/admin/coupons', response: { coupons: [] } },
  { component: AdminExchangeRatesComponent, path: '/rates', response: { rates: {}, updatedAt: null } },
  { component: AdminSettingsComponent, path: '/admin/settings', response: { settings: { free_shipping_min_pkr: '3000' } } },
];

describe('admin error recovery through real services and mocked HTTP', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { user$: of(null) } },
      { provide: ToastService, useValue: { show: () => undefined } },
    ] });
    http = TestBed.inject(HttpTestingController);
    spyOn(console, 'error');
  });
  afterEach(() => http.verify());

  for (const screen of screens) {
    it(`keeps ${screen.path} failed reads distinct and recovers only after retry`, async () => {
      const fixture = TestBed.createComponent(screen.component);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const url = `${environment.apiUrl}${screen.path}`;
      if (screen.component === AdminProductsComponent) {
        http.expectOne(`${environment.apiUrl}/categories`).flush({ categories: [] });
      }

      expect(root.querySelector('app-loading-spinner')).not.toBeNull();
      http.expectOne((request) => request.url === url).flush(
        { message: 'Read unavailable' }, { status: 503, statusText: 'Service Unavailable' },
      );
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(root.querySelector('app-load-error')).not.toBeNull();
      expect(root.textContent).toContain('Read unavailable');
      expect(root.querySelector('.empty-state, .table-card, .cat-grid, .coupon-grid, .rate-grid')).toBeNull();
      expect(root.querySelector('.page-sub')?.textContent).not.toMatch(/\b0\b/);
      http.expectNone((request) => request.url === url);

      if (screen.component === AdminSettingsComponent) {
        for (const input of Array.from(root.querySelectorAll('input'))) {
          expect(input.disabled).toBeTrue();
          expect(input.placeholder).toBe('');
        }
        const settings = fixture.componentInstance as AdminSettingsComponent;
        settings.onValueChange('store_email', 'changed@example.com');
        settings.save();
        http.expectNone((request) => request.method !== 'GET');
      }
      if (screen.component === AdminExchangeRatesComponent) {
        expect(root.querySelector<HTMLButtonElement>('.page-head button')?.disabled).toBeTrue();
      }

      root.querySelector<HTMLButtonElement>('app-load-error button')!.click();
      fixture.detectChanges();
      expect(root.querySelector('app-loading-spinner')).not.toBeNull();
      expect(root.querySelector('app-load-error, .empty-state')).toBeNull();
      const component = fixture.componentInstance as { loadError: () => string | null };
      expect(component.loadError()).toBeNull();
      http.expectOne((request) => request.url === url).flush(screen.response);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.loadError()).toBeNull();
      expect(root.querySelector('app-load-error, app-loading-spinner')).toBeNull();
      if (screen.component === AdminSettingsComponent) {
        expect(root.querySelector<HTMLInputElement>('#st-free_shipping_min_pkr')?.value).toBe('3000');
        expect(root.querySelector<HTMLInputElement>('#st-free_shipping_min_pkr')?.disabled).toBeFalse();
      } else {
        expect(root.querySelector('.empty-state')).not.toBeNull();
      }
    });
  }
});
