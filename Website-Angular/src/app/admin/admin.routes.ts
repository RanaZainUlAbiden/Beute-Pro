import { Routes } from '@angular/router';

import { adminGuard } from '../guards/admin.guard';
import type { PageData } from '../app.routes';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

/* The admin screens sit below the header like every other routed
   page (`noHero`), and none of them shows the storefront's reading
   progress bar — it is a tool, not an article. */
const adminPage = { noHero: true, progress: false } satisfies PageData;

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
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
      {
        path: 'contact',
        title: 'Messages · Béute Pro Admin',
        data: adminPage,
        loadComponent: () => import('./contact-messages/contact-messages').then((m) => m.ContactMessagesComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
