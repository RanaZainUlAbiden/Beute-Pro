import { RenderMode, ServerRoute } from '@angular/ssr';

import { CATEGORIES, PRODUCTS } from './core/data/products';

/* Every page is prerendered at build time, including one file per
   product and per category. International organic search is the reason
   this app is server-rendered at all, so the parameterised routes get
   their params from the catalogue rather than falling back to
   client-side rendering. */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'product/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => PRODUCTS.map((p) => ({ id: p.id })),
  },
  {
    path: 'shop/:category',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => CATEGORIES.map((c) => ({ category: c.id })),
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
