import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { imgSrc, imgDims } from '../../core/image';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-cart-drawer',
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ImgFallbackDirective, NgOptimizedImage],
  host: { '(document:keydown.escape)': 'cart.close()' },
})
export class CartDrawer {
  protected readonly cart = inject(CartService);
  protected readonly i18n = inject(I18nService);
  protected readonly imgSrc = imgSrc;
  protected readonly imgDims = imgDims;
}
