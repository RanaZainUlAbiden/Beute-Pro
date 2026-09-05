import { Injectable, computed, inject, signal } from '@angular/core';

import { PRODUCTS } from '../data/products';
import type { Product } from '../models/product';
import { I18nService } from './i18n.service';
import { LayoutService } from './layout.service';
import { ToastService } from './toast.service';

export interface CartLine {
  id: string;
  qty: number;
}

/** A line joined to its product, for rendering the drawer. */
export interface CartRow extends CartLine {
  product: Product;
}

/* =============================================================
   CART
   ============================================================= */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly layout = inject(LayoutService);

  readonly items = signal<readonly CartLine[]>([]);
  readonly isOpen = signal(false);

  readonly rows = computed<readonly CartRow[]>(() =>
    this.items().flatMap((line) => {
      const product = PRODUCTS.find((p) => p.id === line.id);
      return product ? [{ ...line, product }] : [];
    }),
  );

  readonly count = computed(() => this.items().reduce((n, i) => n + i.qty, 0));

  readonly total = computed(() =>
    this.items().reduce((n, i) => {
      const p = PRODUCTS.find((x) => x.id === i.id);
      return n + (p ? p.price * i.qty : 0);
    }, 0),
  );

  add(id: string, qty = 1): void {
    this.items.update((items) => {
      const line = items.find((i) => i.id === id);
      return line
        ? items.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
        : [...items, { id, qty }];
    });
    this.open();
    this.toast.show(this.i18n.t('cart.added'));
  }

  setQty(id: string, qty: number): void {
    this.items.update((items) =>
      qty < 1
        ? items.filter((i) => i.id !== id)
        : items.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  }

  step(id: string, delta: number): void {
    const line = this.items().find((i) => i.id === id);
    if (!line) return;
    this.setQty(id, line.qty + delta);
  }

  remove(id: string): void {
    this.items.update((items) => items.filter((i) => i.id !== id));
  }

  /** ✅ NEW: Clear all items from cart and close the drawer */
  clear(): void {
    this.items.set([]);
    this.close();
  }

  open(): void {
    this.isOpen.set(true);
    this.layout.lock();
  }

  close(): void {
    this.isOpen.set(false);
    this.layout.unlock();
  }
}