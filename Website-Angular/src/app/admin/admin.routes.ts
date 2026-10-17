import { inject } from '@angular/core';
import { I18nService } from '../core/services/i18n.service';
import type { TranslationKey } from '../core/data/i18n.data';
import { Routes } from '@angular/router';

import { adminGuard } from '../guards/admin.guard';
import type { PageData } from '../app.routes';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

/* The admin screens sit below the header like every other routed
   page (`noHero`), and none of them shows the storefront's reading
   progress bar — it is a tool, not an article. `chrome: false` hides
   the site header/footer entirely: the admin panel is a tool, not a
   storefront page, and it has its own rail/nav in AdminLayoutComponent. */
const adminPage = { noHero: true, progress: false, chrome: false } satisfies PageData;

function adminTitle(key: TranslationKey): string {
  const i18n = inject(I18nService);
  return i18n.t(key) + ' · ' + i18n.t('admin.routes.admin');
}

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      // ─────────── Overview ───────────
      {
        path: 'dashboard',
        title: () => adminTitle('admin.dashboard.title'),
        data: adminPage,
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'orders',
        title: () => adminTitle('admin.customers.colOrders'),
        data: adminPage,
        loadComponent: () => import('./orders/admin-orders.component').then((m) => m.AdminOrdersComponent),
      },
      {
        path: 'orders/:id',
        title: () => adminTitle('admin.orders.colOrder'),
        data: adminPage,
        loadComponent: () =>
          import('./order-detail/admin-order-detail.component').then((m) => m.AdminOrderDetailComponent),
      },
      {
        path: 'revenue',
        title: () => adminTitle('admin.revenue.colRevenue'),
        data: adminPage,
        loadComponent: () => import('./revenue/revenue.component').then((m) => m.RevenueComponent),
      },

      // ─────────── Catalog ───────────
      {
        path: 'products',
        title: () => adminTitle('admin.nav.products'),
        data: adminPage,
        loadComponent: () =>
          import('./products/admin-products.component').then((m) => m.AdminProductsComponent),
      },
      {
        path: 'products/new',
        title: () => adminTitle('admin.products.form.newProduct'),
        data: adminPage,
        loadComponent: () =>
          import('./products/product-form.component').then((m) => m.ProductFormComponent),
      },
      {
        path: 'products/:id/edit',
        title: () => adminTitle('admin.products.form.editProduct'),
        data: adminPage,
        loadComponent: () =>
          import('./products/product-form.component').then((m) => m.ProductFormComponent),
      },
      {
        path: 'categories',
        title: () => adminTitle('admin.nav.categories'),
        data: adminPage,
        loadComponent: () =>
          import('./categories/admin-categories.component').then((m) => m.AdminCategoriesComponent),
      },
      {
        path: 'inventory',
        title: () => adminTitle('admin.nav.inventory'),
        data: adminPage,
        loadComponent: () =>
          import('./inventory/admin-inventory.component').then((m) => m.AdminInventoryComponent),
      },

      // ─────────── Customers ───────────
      {
        path: 'customers',
        title: () => adminTitle('admin.customers.title'),
        data: adminPage,
        loadComponent: () =>
          import('./customers/admin-customers.component').then((m) => m.AdminCustomersComponent),
      },
      {
        path: 'users',
        title: () => adminTitle('admin.nav.users'),
        data: adminPage,
        loadComponent: () =>
          import('./users/admin-users.component').then((m) => m.AdminUsersComponent),
      },

      // ─────────── Marketing ───────────
      {
        path: 'coupons',
        title: () => adminTitle('admin.nav.coupons'),
        data: adminPage,
        loadComponent: () =>
          import('./coupons/admin-coupons.component').then((m) => m.AdminCouponsComponent),
      },

      // ─────────── System ───────────
      {
        path: 'contact',
        title: () => adminTitle('admin.messages.title'),
        data: adminPage,
        loadComponent: () =>
          import('./contact-messages/contact-messages').then((m) => m.ContactMessagesComponent),
      },
      {
        path: 'exchange-rates',
        title: () => adminTitle('admin.nav.rates'),
        data: adminPage,
        loadComponent: () =>
          import('./exchange-rates/admin-exchange-rates.component').then(
            (m) => m.AdminExchangeRatesComponent,
          ),
      },
      {
        path: 'settings',
        title: () => adminTitle('admin.nav.settings'),
        data: adminPage,
        loadComponent: () =>
          import('./settings/admin-settings.component').then((m) => m.AdminSettingsComponent),
      },

      // ─────────── Default ───────────
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];