import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { environment } from '../environments/environment';

/** Extra per-route data the shell reads: body classes and <meta>. */
export interface PageData {
  noHero: boolean;
  progress: boolean;
  description?: string;
}

export const routes: Routes = [
  // ---- PUBLIC ROUTES ----
  {
    path: '',
    pathMatch: 'full',
    title: 'Béute Pro',
    data: {
      noHero: false,
      progress: false,
      description:
        'Cold-pressed oils, handcrafted soaps and botanical face mists. Halal certified, paraben free, made in small batches in Faisalabad.',
    } satisfies PageData,
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'shop',
    title: 'Béute Pro',
    data: { noHero: false, progress: true } satisfies PageData,
    loadComponent: () => import('./features/shop/shop').then((m) => m.Shop),
  },
  {
    path: 'shop/:category',
    title: 'Béute Pro',
    data: { noHero: false, progress: true } satisfies PageData,
    loadComponent: () => import('./features/shop/shop').then((m) => m.Shop),
  },
  {
    path: 'product/:id',
    title: 'Béute Pro',
    data: { noHero: true, progress: true } satisfies PageData,
    loadComponent: () => import('./features/product/product').then((m) => m.ProductPage),
  },
  {
    path: 'about',
    title: 'Béute Pro',
    data: {
      noHero: true,
      progress: true,
      description:
        'Béute Pro is nurtured, not manufactured — cold-pressed oils, handcrafted soaps and botanical mists made in small batches in Faisalabad.',
    } satisfies PageData,
    loadComponent: () => import('./features/about/about').then((m) => m.About),
  },
  {
    path: 'contact',
    title: 'Béute Pro',
    data: {
      noHero: false,
      progress: true,
      description:
        'Get in touch with Béute Pro — questions about an order, an ingredient, or anything else.',
    } satisfies PageData,
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'faq',
    title: 'Béute Pro',
    data: {
      noHero: true,
      progress: true,
      description:
        'Answers to common questions about Béute Pro — ingredients, certifications, returns and more.',
    } satisfies PageData,
    loadComponent: () => import('./features/faq/faq').then((m) => m.Faq),
  },
  {
    path: 'policies',
    title: 'Béute Pro',
    data: {
      noHero: true,
      progress: true,
      description: "Béute Pro's privacy policy and refund & exchange policy.",
    } satisfies PageData,
    loadComponent: () => import('./features/policies/policies').then((m) => m.Policies),
  },

  // ---- AUTHENTICATION ROUTES ----
  {
    path: 'login',
    title: 'Sign In · Béute Pro',
    data: { noHero: true, progress: false } satisfies PageData,
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/success',
    title: 'Authenticating · Béute Pro',
    data: { noHero: true, progress: false } satisfies PageData,
    loadComponent: () => import('./features/auth/auth-success/auth-success').then((m) => m.AuthSuccessComponent),
  },

  // ---- CHECKOUT (public – guests allowed) ----
  {
    path: 'checkout',
    title: 'Checkout · Béute Pro',
    data: { noHero: true, progress: true } satisfies PageData,
    loadComponent: () => import('./features/checkout/checkout').then((m) => m.CheckoutComponent),
  },

  // ---- TRACK ORDER (public) ----
  {
    path: 'track',
    title: 'Track Order · Béute Pro',
    data: { noHero: true, progress: true } satisfies PageData,
    loadComponent: () => import('./features/orders/track-order/track-order').then((m) => m.TrackOrderComponent),
  },

  // ---- PROTECTED ROUTES ----
  {
    path: 'profile',
    title: 'My Profile · Béute Pro',
    data: { noHero: true, progress: true } satisfies PageData,
    loadComponent: () => import('./features/auth/profile/profile').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'orders',
    title: 'My Orders · Béute Pro',
    data: { noHero: true, progress: true } satisfies PageData,
    loadComponent: () => import('./features/orders/orders-page/orders-page').then((m) => m.OrdersPageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'orders/:orderNumber',
    title: 'Order Details · Béute Pro',
    data: { noHero: true, progress: true } satisfies PageData,
    loadComponent: () => import('./features/orders/order-detail/order-detail').then((m) => m.OrderDetailComponent),
    canActivate: [authGuard],
  },
  // ✅ Wishlist route
  {
    path: 'wishlist',
    title: 'Wishlist · Béute Pro',
    data: { noHero: true, progress: true } satisfies PageData,
    loadComponent: () => import('./features/wishlist/wishlist-page/wishlist-page').then((m) => m.WishlistPageComponent),
    canActivate: [authGuard],
  },

  // ---- ADMIN ROUTE (complex path - obfuscated) ----
  {
    path: environment.adminPath,
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [adminGuard],
  },

  // ---- FALLBACK ----
  { path: '**', redirectTo: '' },
];