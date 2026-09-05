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
import { PRODUCTS, CATEGORIES } from '../../core/data/products';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search.html',  // ensure file name matches
  styleUrls: ['./search.scss'], // ensure file name matches
  host: {
    '(document:keydown.escape)': 'close()',
    '[class.is-open]': 'searchService.isOpen()',
  },
})
export class SearchComponent {
  searchService = inject(SearchService);
  i18n = inject(I18nService);

  // Expose CATEGORIES if needed (but we'll use method)
  protected readonly CATEGORIES = CATEGORIES;

  query = signal('');
  inputElement = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  filteredProducts = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return [];

    return PRODUCTS.filter((p) => {
      const name = p.en.name.toLowerCase();
      const nameAr = p.ar.name.toLowerCase();
      const categoryEn =
        CATEGORIES.find((c) => c.id === p.category)?.en.toLowerCase() || '';
      const categoryAr =
        CATEGORIES.find((c) => c.id === p.category)?.ar.toLowerCase() || '';
      const tagline = p.en.tagline.toLowerCase();
      const taglineAr = p.ar.tagline.toLowerCase();

      return (
        name.includes(q) ||
        nameAr.includes(q) ||
        categoryEn.includes(q) ||
        categoryAr.includes(q) ||
        tagline.includes(q) ||
        taglineAr.includes(q) ||
        p.id.includes(q)
      );
    });
  });

  // ✅ Helper method for template
  getCategoryName(categoryId: string): string {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category ? this.i18n.catName(category) : categoryId;
  }

  constructor() {
    effect(() => {
      if (this.searchService.isOpen()) {
        setTimeout(() => {
          const el = this.inputElement()?.nativeElement;
          if (el) el.focus();
        }, 50);
      } else {
        this.query.set('');
      }
    });
  }

  close(): void {
    this.searchService.close();
  }

  clear(): void {
    this.query.set('');
  }
}