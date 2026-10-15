import {
  Component,
  signal,
  computed,
  inject,
  effect,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../core/services/search.service';
import { I18nService } from '../../core/services/i18n.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ApiProduct, ApiCategory } from '../../core/models/api.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search.html',
  styleUrls: ['./search.scss'],
  host: {
    '(document:keydown.escape)': 'close()',
    '[class.is-open]': 'searchService.isOpen()',
  },
})
export class SearchComponent {
  searchService = inject(SearchService);
  i18n = inject(I18nService);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);

  // ✅ Live data
  protected readonly allProducts = signal<ApiProduct[]>([]);
  protected readonly allCategories = signal<ApiCategory[]>([]);
  private loaded = false;

  query = signal('');
  inputElement = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  filteredProducts = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return [];

    const cats = this.allCategories();

    return this.allProducts().filter((p) => {
      const name = (p.en?.name ?? '').toLowerCase();
      const nameAr = (p.ar?.name ?? '').toLowerCase();
      const catEn = cats.find((c) => c.id === p.category)?.en.toLowerCase() ?? '';
      const catAr = cats.find((c) => c.id === p.category)?.ar.toLowerCase() ?? '';
      const tagline = (p.en?.tagline ?? '').toLowerCase();
      const taglineAr = (p.ar?.tagline ?? '').toLowerCase();

      return (
        name.includes(q) ||
        nameAr.includes(q) ||
        catEn.includes(q) ||
        catAr.includes(q) ||
        tagline.includes(q) ||
        taglineAr.includes(q) ||
        p.id.includes(q)
      );
    });
  });

  // ✅ Helper method for template
  getCategoryName(categoryId: string): string {
    const cat = this.allCategories().find((c) => c.id === categoryId);
    return cat ? this.i18n.catName(cat) : categoryId;
  }

  constructor() {
    effect(() => {
      if (this.searchService.isOpen()) {
        this.ensureLoaded();
        setTimeout(() => {
          const el = this.inputElement()?.nativeElement;
          if (el) el.focus();
        }, 50);
      } else {
        this.query.set('');
      }
    });
  }

  /** Load products + categories once, then cache. */
  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;

    this.productService.list({ limit: 500 }).subscribe({
      next: (res) => this.allProducts.set(res.products),
      error: (err) => console.error('Search: failed to load products', err),
    });

    this.categoryService.list().subscribe({
      next: (res) => this.allCategories.set(res.categories),
      error: (err) => console.error('Search: failed to load categories', err),
    });
  }

  close(): void {
    this.searchService.close();
  }

  clear(): void {
    this.query.set('');
  }
}