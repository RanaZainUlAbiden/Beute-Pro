import { Routes } from '@angular/router';

/** Extra per-route data the shell reads: body classes and <meta>. */
export interface PageData {
  /** Page starts below the fixed header rather than under it. */
  noHero: boolean;
  /** Show the scroll-progress hairline. */
  progress: boolean;
  /** <meta name="description">; omitted where the static page had none. */
  description?: string;
}

export const routes: Routes = [
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
      // full-viewport hero: the header overlays it, as on home and shop
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
  { path: '**', redirectTo: '' },
];
