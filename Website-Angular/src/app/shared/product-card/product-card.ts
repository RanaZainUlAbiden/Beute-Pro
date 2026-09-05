import { ChangeDetectionStrategy, Component, computed, inject, input, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { CATEGORIES } from '../../core/data/products';
import { imgSrc, imgDims } from '../../core/image';
import type { Product } from '../../core/models/product';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';
import { WishlistService } from '../../services/wishlist';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, ImgFallbackDirective, CommonModule, NgOptimizedImage],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  protected readonly i18n = inject(I18nService);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  protected readonly imgSrc = imgSrc;

  readonly product = input.required<Product>();

  protected readonly dims = computed(() => imgDims(this.product().id));

  protected readonly categoryName = computed(() =>
    this.i18n.catName(CATEGORIES.find((c) => c.id === this.product().category)),
  );

  protected readonly badgeLabel = computed(() => {
    const badge = this.product().badge;
    return badge ? this.i18n.t(`badge.${badge}`) : '';
  });

  protected readonly isInWishlist = computed(() => this.wishlist.isInWishlist(this.product().id));

  protected add(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.cart.add(this.product().id, 1);
  }

  protected toggleWishlist(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const id = this.product().id;
    if (this.isInWishlist()) {
      this.wishlist.remove(id).subscribe({
        error: (err) => console.error('Failed to remove from wishlist', err),
      });
    } else {
      this.wishlist.add(id).subscribe({
        error: (err) => console.error('Failed to add to wishlist', err),
      });
    }
  }
}