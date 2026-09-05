import { Routes } from '@angular/router';
import { adminGuard } from '../guards/admin.guard';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent),
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./order-detail/admin-order-detail.component').then(m => m.AdminOrderDetailComponent),
      },
      {
        path: 'revenue',
        loadComponent: () => import('./revenue/revenue.component').then(m => m.RevenueComponent),
      },
      // ✅ Contact Messages route
      {
        path: 'contact',
        loadComponent: () => import('./contact-messages/contact-messages').then(m => m.ContactMessagesComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];