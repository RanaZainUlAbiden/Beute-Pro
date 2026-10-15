import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProductService } from '../../../services/product.service';
import { WishlistService } from '../../../services/wishlist';
import { I18nService } from '../../../core/services/i18n.service';
import type { ApiProduct } from '../../../core/models/api.model';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-wishlist-page',
  imports: [RouterLink, ProductCard],
  templateUrl: './wishlist-page.html',
  styleUrl: './wishlist-page.scss',
})
export class WishlistPageComponent implements OnInit {
  private readonly wishlist = inject(WishlistService);
  private readonly productService = inject(ProductService);
  protected readonly i18n = inject(I18nService);

  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  /** All API products, cached for local filter by saved IDs. */
  private readonly allProducts = signal<ApiProduct[]>([]);

  /** Saved IDs resolved against the API catalogue. */
  protected readonly products = computed<ApiProduct[]>(() => {
    const saved = new Set(this.wishlist.items());
    return this.allProducts().filter((p) => saved.has(p.id));
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.busy.set(true);
    this.failed.set(false);

    // Load the wishlist IDs first, then fetch the full catalogue
    this.wishlist.loadWishlist().subscribe({
      next: () => {
        this.productService.list({ limit: 500 }).subscribe({
          next: (res) => {
            this.allProducts.set(res.products);
            this.busy.set(false);
          },
          error: () => {
            this.busy.set(false);
            this.failed.set(true);
          },
        });
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }
}