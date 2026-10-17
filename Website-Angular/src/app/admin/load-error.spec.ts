import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { Type } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, of, throwError } from 'rxjs';

import { AdminCategoriesComponent } from './categories/admin-categories.component';
import { AdminProductsComponent } from './products/admin-products.component';
import { AdminInventoryComponent } from './inventory/admin-inventory.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminCouponsComponent } from './coupons/admin-coupons.component';
import { AdminExchangeRatesComponent } from './exchange-rates/admin-exchange-rates.component';
import { AdminSettingsComponent } from './settings/admin-settings.component';

import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { InventoryService } from '../services/inventory.service';
import { UserAdminService } from '../services/user-admin.service';
import { CouponService } from '../services/coupon.service';
import { CurrencyService } from '../services/currency.service';
import { SettingsService } from '../services/settings.service';
import { ExportService } from '../services/export.service';
import { AuthService } from '../services/auth';
import { ToastService } from '../core/services/toast.service';

/* =============================================================
   EMPTY IS NOT BROKEN  (admin audit P2)

   Every admin screen that reads used to funnel a failed request
   into its empty state: "0 categories", "No coupons yet", "No
   exchange rates configured yet". The database was fine in every
   one of those cases — the read wasn't. An admin acting on that
   reading is the actual risk, and on Settings it was concrete:
   the form stayed editable behind placeholder text that looked
   exactly like saved values, so Save could overwrite real
   settings with nothing.

   These tests pin the distinction per screen:
     1. a failed read shows the error panel,
     2. and NOT the empty state,
     3. retry re-issues the request (and only on a click),
     4. a successful retry clears the error and shows the data.
   ============================================================= */

/** A failure with a server-supplied message, like a real 500 body. */
const serverError = () =>
  throwError(
    () =>
      new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        error: { error: 'relation "categories" does not exist' },
      }),
  );

interface Screen {
  readonly name: string;
  readonly component: Type<object>;
  /** Installs the spies and returns the one whose failure we drive. */
  readonly stub: () => jasmine.Spy;
  /** What a good response looks like, so retry can succeed. */
  readonly ok: unknown;
  /** Text the OLD empty state rendered — must be absent on failure. */
  readonly emptyText: string;
}

const spy = <T>(name: string, methods: readonly string[]): jasmine.SpyObj<T> =>
  jasmine.createSpyObj(name, methods as string[]) as jasmine.SpyObj<T>;

const SCREENS: readonly Screen[] = [
  {
    name: 'Categories',
    component: AdminCategoriesComponent,
    ok: { categories: [{ id: 'mists', en: 'Mists', ar: 'رذاذ', displayOrder: 1 }] },
    emptyText: 'No categories yet',
    stub: () => {
      const s = spy<CategoryService>('CategoryService', ['list', 'adminDelete']);
      TestBed.overrideProvider(CategoryService, { useValue: s });
      return s.list;
    },
  },
  {
    name: 'Products',
    component: AdminProductsComponent,
    ok: { products: [], total: 0 },
    emptyText: 'No products found',
    stub: () => {
      const cats = spy<CategoryService>('CategoryService', ['list']);
      cats.list.and.returnValue(of({ categories: [] }) as Observable<never>);
      TestBed.overrideProvider(CategoryService, { useValue: cats });
      const s = spy<ProductService>('ProductService', ['adminList', 'adminDelete']);
      TestBed.overrideProvider(ProductService, { useValue: s });
      TestBed.overrideProvider(ExportService, {
        useValue: spy<ExportService>('ExportService', ['exportProducts']),
      });
      return s.adminList;
    },
  },
  {
    name: 'Inventory',
    component: AdminInventoryComponent,
    ok: { items: [] },
    emptyText: 'No products match your filter',
    stub: () => {
      const s = spy<InventoryService>('InventoryService', ['adminList', 'adminSet']);
      TestBed.overrideProvider(InventoryService, { useValue: s });
      return s.adminList;
    },
  },
  {
    name: 'Users',
    component: AdminUsersComponent,
    ok: { users: [], total: 0 },
    emptyText: 'No users match your filter',
    stub: () => {
      const auth = spy<AuthService>('AuthService', ['isAdmin', 'isLoggedIn']);
      TestBed.overrideProvider(AuthService, { useValue: auth });
      const s = spy<UserAdminService>('UserAdminService', ['list', 'setRole']);
      TestBed.overrideProvider(UserAdminService, { useValue: s });
      return s.list;
    },
  },
  {
    name: 'Coupons',
    component: AdminCouponsComponent,
    ok: { coupons: [] },
    emptyText: 'No coupons yet',
    stub: () => {
      const s = spy<CouponService>('CouponService', ['adminList', 'adminRemove']);
      TestBed.overrideProvider(CouponService, { useValue: s });
      return s.adminList;
    },
  },
  {
    name: 'Exchange rates',
    component: AdminExchangeRatesComponent,
    ok: { rates: { USD: 0.0036 }, updatedAt: '2026-10-16T09:56:38.996Z' },
    emptyText: 'No exchange rates configured yet',
    stub: () => {
      const s = spy<CurrencyService>('CurrencyService', ['getRates', 'refresh', 'setRate']);
      TestBed.overrideProvider(CurrencyService, { useValue: s });
      return s.getRates;
    },
  },
  {
    name: 'Settings',
    component: AdminSettingsComponent,
    ok: { settings: { free_shipping_min_pkr: '3000' } },
    // Settings has no empty state; its danger is the editable form.
    emptyText: '',
    stub: () => {
      const s = spy<SettingsService>('SettingsService', ['adminGetAll', 'adminSetMany']);
      TestBed.overrideProvider(SettingsService, { useValue: s });
      return s.adminGetAll;
    },
  },
];

describe('admin load failures are not empty states', () => {
  for (const screen of SCREENS) {
    describe(screen.name, () => {
      let fixture: ComponentFixture<object>;
      let load: jasmine.Spy;

      const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
      const panel = () => fixture.debugElement.query(By.css('app-load-error'));
      const retryButton = (): HTMLButtonElement =>
        fixture.debugElement.query(By.css('app-load-error button')).nativeElement;

      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            provideRouter([]),
            { provide: ToastService, useValue: spy<ToastService>('ToastService', ['show']) },
          ],
        });
        load = screen.stub();
        load.and.returnValue(serverError());
        fixture = TestBed.createComponent(screen.component);
        fixture.detectChanges();
      });

      it('shows the error panel, with the API message, when the read fails', () => {
        expect(panel()).withContext('error panel').not.toBeNull();
        expect(text()).toContain('relation "categories" does not exist');
        expect(fixture.debugElement.query(By.css('.cat-grid, .table-card, .coupon-grid, .rate-grid')))
          .withContext('data hidden after a failed read').toBeNull();
      });

      it('does not claim a zero count after a failed read', () => {
        const subtitle = fixture.debugElement.query(By.css('.page-sub')).nativeElement as HTMLElement;
        expect(subtitle.textContent).not.toMatch(/\b0\b/);
      });

      it('shows a durable error for a network failure too', () => {
        load.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
        retryButton().click();
        fixture.detectChanges();
        expect(panel()).not.toBeNull();
        if (screen.emptyText) expect(text()).not.toContain(screen.emptyText);
      });

      if (screen.emptyText) {
        it('does not show the empty state when the read fails', () => {
          expect(text()).not.toContain(screen.emptyText);
        });

        it('shows the empty state only after a successful empty response', () => {
          const empty = screen.name === 'Exchange rates'
            ? { rates: {}, updatedAt: null }
            : screen.name === 'Categories' ? { categories: [] } : screen.ok;
          load.and.returnValue(of(empty) as Observable<never>);
          retryButton().click();
          fixture.detectChanges();

          expect(panel()).toBeNull();
          expect(text()).toContain(screen.emptyText);
        });
      }

      for (const error of [null, {}, new Error('')]) {
        it(`keeps a failed read distinct from empty data without error text (${String(error)})`, () => {
          load.and.returnValue(throwError(() => error));
          retryButton().click();
          fixture.detectChanges();

          expect(panel()).withContext('message-free failure still needs an error panel').not.toBeNull();
          if (screen.emptyText) expect(text()).not.toContain(screen.emptyText);
          if (screen.name === 'Settings') {
            const component = fixture.componentInstance as AdminSettingsComponent;
            component.onValueChange('store_email', 'changed@example.com');
            component.save();
            expect(TestBed.inject(SettingsService).adminSetMany).not.toHaveBeenCalled();
          }
        });
      }

      if (['Categories', 'Products', 'Inventory', 'Users', 'Coupons'].includes(screen.name)) {
        it('does not claim zero records while a retry is still pending', () => {
          const pending = new Subject<unknown>();
          load.and.returnValue(pending);
          retryButton().click();
          fixture.detectChanges();

          const count = fixture.debugElement.query(By.css('.page-sub')).nativeElement as HTMLElement;
          expect(count.textContent?.trim()).toBe('—');
          expect(panel()).toBeNull();
          expect(fixture.debugElement.query(By.css('app-loading-spinner'))).not.toBeNull();
          pending.next(screen.ok);
          pending.complete();
          fixture.detectChanges();
          expect(fixture.debugElement.query(By.css('.page-sub')).nativeElement.textContent).not.toContain('—');
        });
      }

      it('does not retry on its own', () => {
        expect(load).toHaveBeenCalledTimes(1);
        // Nothing but a click may issue a second request; a timer here
        // would hammer an API that is already failing.
        jasmine.clock().install();
        jasmine.clock().tick(30_000);
        jasmine.clock().uninstall();
        expect(load).toHaveBeenCalledTimes(1);
      });

      it('retries on click and clears the error once the read succeeds', () => {
        load.and.returnValue(of(screen.ok) as Observable<never>);
        retryButton().click();
        fixture.detectChanges();

        expect(load).toHaveBeenCalledTimes(2);
        expect(panel()).withContext('error panel after successful retry').toBeNull();
        expect(text()).not.toContain('relation "categories" does not exist');
        expect(fixture.debugElement.query(By.css('.empty-state, .cat-grid, .table-card, .coupon-grid, .rate-grid, .groups')))
          .withContext('success content is rendered').not.toBeNull();
      });

      if (screen.name === 'Exchange rates') {
        it('disables Refresh from API while the saved baseline is unknown', () => {
          const button = fixture.debugElement.query(By.css('.page-head button')).nativeElement as HTMLButtonElement;
          expect(button.disabled).toBeTrue();
          button.click();
          expect(TestBed.inject(CurrencyService).refresh).not.toHaveBeenCalled();
        });
      }
    });
  }
});

/* -------------------------------------------------------------
   Settings is the one that could destroy data, so it gets its
   own assertions: the fields must be locked and Save refused
   while the saved values are unknown. */
describe('settings form is locked after a failed read', () => {
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let service: jasmine.SpyObj<SettingsService>;

  const inputs = (): HTMLInputElement[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('input'));
  const saveButton = (): HTMLButtonElement | undefined =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((b) => (b.textContent ?? '').includes('Save'));

  beforeEach(() => {
    service = spy<SettingsService>('SettingsService', ['adminGetAll', 'adminSetMany']);
    service.adminGetAll.and.returnValue(serverError() as Observable<never>);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SettingsService, useValue: service },
        { provide: ToastService, useValue: spy<ToastService>('ToastService', ['show']) },
      ],
    });
    fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();
  });

  // NgModel applies [disabled] on a microtask, so settle before asserting.
  it('disables every field so placeholders cannot be mistaken for values', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const all = inputs();
    expect(all.length).withContext('fields rendered').toBeGreaterThan(0);
    for (const input of all) {
      expect(input.disabled).withContext(input.id).toBeTrue();
    }
  });

  it('drops the placeholders that looked like saved values', () => {
    for (const input of inputs()) {
      expect(input.placeholder).withContext(input.id).toBe('');
    }
  });

  it('disables Save', () => {
    expect(saveButton()?.disabled).toBeTrue();
  });

  it('refuses to write even if save() is called directly', () => {
    fixture.componentInstance.onValueChange('store_email', 'changed@example.com');
    fixture.componentInstance.save();
    expect(service.adminSetMany).not.toHaveBeenCalled();
  });

  it('unlocks the form once a retry succeeds', async () => {
    service.adminGetAll.and.returnValue(
      of({ settings: { free_shipping_min_pkr: '3000' } }) as Observable<never>,
    );
    fixture.debugElement.query(By.css('app-load-error button')).nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('app-load-error'))).toBeNull();
    for (const input of inputs()) {
      expect(input.disabled).withContext(input.id).toBeFalse();
    }
    expect(inputs().find((input) => input.id === 'st-free_shipping_min_pkr')?.placeholder).toBe('3000');
  });
});
