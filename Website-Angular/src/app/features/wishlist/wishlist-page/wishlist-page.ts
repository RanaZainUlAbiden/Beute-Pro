import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PRODUCTS } from '../../../core/data/products';
import { I18nService } from '../../../core/services/i18n.service';
import type { Product } from '../../../core/models/product';
import { ProductCard } from '../../../shared/product-card/product-card';
import { WishlistService } from '../../../services/wishlist';

/* =============================================================
   WISHLIST

   The saved ids come back from the API; the products themselves
   come from the local catalogue, so the grid is the same card
   the shop renders — including its own heart, which is how a
   product leaves this page.
   ============================================================= */
@Component({
  selector: 'app-wishlist-page',
  imports: [RouterLink, ProductCard],
  templateUrl: './wishlist-page.html',
  styleUrl: './wishlist-page.scss',
})
export class WishlistPageComponent implements OnInit {
  private readonly wishlist = inject(WishlistService);
  protected readonly i18n = inject(I18nService);

  private readonly ids = signal<readonly string[]>([]);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  /** Saved ids, resolved against the catalogue and in its order. */
  protected readonly products = computed<Product[]>(() => {
    const saved = new Set(this.ids());
    return PRODUCTS.filter((p) => saved.has(p.id));
  });

  ngOnInit(): void {
    this.wishlist.wishlist$.subscribe((items) => this.ids.set(items ?? []));
    this.load();
  }

  protected load(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.wishlist.loadWishlist().subscribe({
      next: () => this.busy.set(false),
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }
}
