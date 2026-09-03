import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RevealDirective } from '../../core/directives/reveal.directive';
import { StaggerDirective } from '../../core/directives/stagger.directive';
import { CATEGORIES, PRODUCTS } from '../../core/data/products';
import { I18nService } from '../../core/services/i18n.service';
import { ProductCard } from '../../shared/product-card/product-card';
import { SplitHeading, type SplitSegment } from '../../shared/split-heading/split-heading';

/* "Skincare"/"Haircare" in the top nav arrive as ?group=, covering
   several categories at once. ?concern= also arrives from the mega
   menu's "by concern" links, but there is no concern data on products
   yet, so it is accepted and ignored — see the build summary. */
const SHOP_GROUPS: Record<string, readonly string[]> = {
  skincare: ['mists', 'serums', 'soaps', 'cold-pressed-oils'],
  haircare: ['hair-oils'],
};

@Component({
  selector: 'app-shop',
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, StaggerDirective, ProductCard, SplitHeading],
})
export class Shop {
  protected readonly i18n = inject(I18nService);
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

  protected readonly categories = CATEGORIES;

  protected readonly list = computed(() => {
    const group = this.activeGroup();
    if (group && SHOP_GROUPS[group]) {
      const ids = SHOP_GROUPS[group];
      return PRODUCTS.filter((p) => ids.includes(p.category));
    }
    const cat = this.activeCat();
    return cat === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);
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

  /** The shop hero photo may not exist yet — fall back to the gradient. */
  protected readonly heroEmpty = signal(false);

  protected isChipActive(id: string): boolean {
    return !this.activeGroup() && id === this.activeCat();
  }

  /** Filtering rewrites the URL in place, as history.replaceState did. */
  protected pick(id: string): void {
    void this.router.navigate(id === 'all' ? ['/shop'] : ['/shop', id], {
      replaceUrl: true,
    });
  }
}
