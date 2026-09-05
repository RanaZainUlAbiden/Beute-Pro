import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../../../services/wishlist';
import { PRODUCTS } from '../../../core/data/products';
import { I18nService } from '../../../core/services/i18n.service';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCard],
  templateUrl: './wishlist-page.html',
  styleUrls: ['./wishlist-page.scss'],
})
export class WishlistPageComponent implements OnInit {
  private wishlist = inject(WishlistService);
  private i18n = inject(I18nService);

  wishlistItems: string[] = [];
  isLoading = true;

  get products() {
    return this.wishlistItems
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(p => p !== undefined);
  }

  ngOnInit(): void {
    this.wishlist.wishlist$.subscribe(items => {
      this.wishlistItems = items;
      this.isLoading = false;
    });
    this.wishlist.loadWishlist().subscribe();
  }

  getProductName(product: any): string {
    return this.i18n.copy(product).name;
  }

  getProductPrice(product: any): string {
    return this.i18n.money(product.price);
  }
}