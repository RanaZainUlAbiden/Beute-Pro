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

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      // ─────────── Overview ───────────
      {
        path: 'dashboard',
        title: 'Dashboard · Béute Pro Admin',
        data: adminPage,
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'orders',
        title: 'Orders · Béute Pro Admin',
        data: adminPage,
        loadComponent: () => import('./orders/admin-orders.component').then((m) => m.AdminOrdersComponent),
      },
      {
        path: 'orders/:id',
        title: 'Order · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./order-detail/admin-order-detail.component').then((m) => m.AdminOrderDetailComponent),
      },
      {
        path: 'revenue',
        title: 'Revenue · Béute Pro Admin',
        data: adminPage,
        loadComponent: () => import('./revenue/revenue.component').then((m) => m.RevenueComponent),
      },

      // ─────────── Catalog ───────────
      {
        path: 'products',
        title: 'Products · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./products/admin-products.component').then((m) => m.AdminProductsComponent),
      },
      {
        path: 'products/new',
        title: 'New product · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./products/product-form.component').then((m) => m.ProductFormComponent),
      },
      {
        path: 'products/:id/edit',
        title: 'Edit product · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./products/product-form.component').then((m) => m.ProductFormComponent),
      },
      {
        path: 'categories',
        title: 'Categories · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./categories/admin-categories.component').then((m) => m.AdminCategoriesComponent),
      },
      {
        path: 'inventory',
        title: 'Inventory · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./inventory/admin-inventory.component').then((m) => m.AdminInventoryComponent),
      },

      // ─────────── Customers ───────────
      {
        path: 'customers',
        title: 'Customers · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./customers/admin-customers.component').then((m) => m.AdminCustomersComponent),
      },
      {
        path: 'users',
        title: 'Users · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./users/admin-users.component').then((m) => m.AdminUsersComponent),
      },

      // ─────────── Marketing ───────────
      {
        path: 'coupons',
        title: 'Coupons · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./coupons/admin-coupons.component').then((m) => m.AdminCouponsComponent),
      },

      // ─────────── System ───────────
      {
        path: 'contact',
        title: 'Messages · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./contact-messages/contact-messages').then((m) => m.ContactMessagesComponent),
      },
      {
        path: 'exchange-rates',
        title: 'Exchange rates · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./exchange-rates/admin-exchange-rates.component').then(
            (m) => m.AdminExchangeRatesComponent,
          ),
      },
      {
        path: 'settings',
        title: 'Settings · Béute Pro Admin',
        data: adminPage,
        loadComponent: () =>
          import('./settings/admin-settings.component').then((m) => m.AdminSettingsComponent),
      },

      // ─────────── Default ───────────
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];