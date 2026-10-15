import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RevealDirective } from '../../core/directives/reveal.directive';
import { StaggerDirective } from '../../core/directives/stagger.directive';
import { I18nService } from '../../core/services/i18n.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ApiProduct, ApiCategory } from '../../core/models/api.model';
import { PageHero } from '../../shared/page-hero/page-hero';
import { ProductCard } from '../../shared/product-card/product-card';
import { SplitHeading, type SplitSegment } from '../../shared/split-heading/split-heading';

/* "Skincare"/"Haircare" in the top nav arrive as ?group=, covering
   several categories at once. */
const SHOP_GROUPS: Record<string, readonly string[]> = {
  skincare: ['mists', 'serums', 'soaps', 'cold-pressed-oils'],
  haircare: ['hair-oils'],
};

@Component({
  selector: 'app-shop',
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, StaggerDirective, PageHero, ProductCard, SplitHeading],
})
export class Shop {
  protected readonly i18n = inject(I18nService);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly activeCat = computed(() => this.params().get('category') ?? 'all');
  protected readonly activeGroup = computed(() => this.query().get('group'));

  // ✅ Live data — signals rather than hardcoded constants
  protected readonly categories = signal<ApiCategory[]>([]);
  protected readonly allProducts = signal<ApiProduct[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  /** Client-side filter over the fetched list — fast, no re-fetch on nav. */
  protected readonly list = computed(() => {
    const products = this.allProducts();
    const group = this.activeGroup();
    if (group && SHOP_GROUPS[group]) {
      const ids = SHOP_GROUPS[group];
      return products.filter((p) => ids.includes(p.category));
    }
    const cat = this.activeCat();
    return cat === 'all' ? products : products.filter((p) => p.category === cat);
  });

  /** Changes whenever the grid contents do, so the stagger re-arms. */
  protected readonly gridKey = computed(() => `${this.activeGroup()}|${this.activeCat()}`);

  protected readonly heroTitle = computed<SplitSegment[]>(() => [
    { text: this.i18n.t('shop.t1') },
    { text: this.i18n.t('shop.t2'), class: 'accent' },
  ]);

  protected readonly processTitle = computed<SplitSegment[]>(() => [
    { text: this.i18n.t('pr.t1') },
    { text: this.i18n.t('pr.t2'), class: 'accent' },
  ]);

  constructor() {
    this.loadAll();
  }

  // ------------------------------------------------------------
  // Data loading
  // ------------------------------------------------------------
  protected loadAll(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    // Categories + products load in parallel
    this.categoryService.list().subscribe({
      next: (res) => this.categories.set(res.categories),
      error: (err) => {
        console.error('Failed to load categories', err);
        // Categories failing shouldn't block the product grid
      },
    });

    this.productService.list({ limit: 500 }).subscribe({
      next: (res) => {
        this.allProducts.set(res.products);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  // ------------------------------------------------------------
  // Filters
  // ------------------------------------------------------------
  protected isChipActive(id: string): boolean {
    return !this.activeGroup() && id === this.activeCat();
  }

  protected pick(id: string): void {
    void this.router.navigate(id === 'all' ? ['/shop'] : ['/shop', id], {
      replaceUrl: true,
    });
  }
}