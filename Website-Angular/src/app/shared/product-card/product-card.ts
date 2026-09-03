import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { CATEGORIES } from '../../core/data/products';
import { imgSrc } from '../../core/image';
import type { Product } from '../../core/models/product';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';

/* One card in any product grid — home, shop and the related row all
   render this, so hover and layout stay identical across the site. */
@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ImgFallbackDirective],
})
export class ProductCard {
  protected readonly i18n = inject(I18nService);
  private readonly cart = inject(CartService);
  protected readonly imgSrc = imgSrc;

  readonly product = input.required<Product>();

  protected readonly categoryName = computed(() =>
    this.i18n.catName(CATEGORIES.find((c) => c.id === this.product().category)),
  );

  protected readonly badgeLabel = computed(() => {
    const badge = this.product().badge;
    return badge ? this.i18n.t(`badge.${badge}`) : '';
  });

  /** The quick-add chip sits inside the card link, so stop navigation. */
  protected add(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.cart.add(this.product().id, 1);
  }
}
