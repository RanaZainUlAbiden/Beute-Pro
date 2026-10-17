import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { adminErrorDetail } from '../admin-api';
import { ExportService } from '../../services/export.service';
import { ApiProduct, ApiCategory } from '../../core/models/api.model';
import { mediaUrl } from '../../core/image';

import { LoadingSpinnerComponent } from '../ui/loading-spinner.component';
import { LoadErrorComponent } from '../ui/load-error/load-error.component';
import { ConfirmDialogComponent } from '../ui/confirm-dialog.component';
import { CsvExportButtonComponent } from '../ui/csv-export-button.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingSpinnerComponent,
    LoadErrorComponent,
    ConfirmDialogComponent,
    CsvExportButtonComponent, // ✅ now actually used in template
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
  styles: [`
    .admin-products { padding: 0; }
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .page-head h1 { margin: 0 0 0.25rem; color: var(--green, #0F2A1D); }
    .page-sub { margin: 0; font-size: 0.88rem; color: var(--green-soft, #5C7A68); }
    .head-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .head-actions .btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.65rem 1.2rem;
      border-radius: var(--r, 8px);
      font-size: 0.82rem; font-weight: 700;
      cursor: pointer; text-decoration: none;
      transition: background 0.3s, transform 0.3s;
    }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .btn--gold:hover { background: var(--gold-lt, #E4C783); transform: translateY(-1px); }

    .filters {
      display: flex; gap: 0.75rem; flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .filter-search {
      display: flex; align-items: center; gap: 0.5rem;
      flex: 1 1 280px;
      background: var(--white, #fff);
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      padding: 0 0.9rem;
      transition: border-color 0.3s;
    }
    .filter-search:focus-within { border-color: var(--gold, #C9A44C); }
    .filter-search svg { color: var(--green-soft, #5C7A68); flex-shrink: 0; }
    .filter-search input {
      border: 0; outline: none; flex: 1;
      padding: 0.7rem 0;
      font-size: 0.9rem; font-family: inherit;
      background: transparent; color: var(--ink, #132018);
    }
    .filter-select {
      padding: 0.7rem 1rem;
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      background: var(--white, #fff);
      font-size: 0.88rem; font-family: inherit;
      color: var(--ink, #132018);
      cursor: pointer;
    }
    .filter-select:focus { outline: none; border-color: var(--gold, #C9A44C); }

    .empty-state {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--green-soft, #5C7A68);
    }
    .empty-state svg { color: var(--ivory-3, #E2DBC9); margin-bottom: 0.75rem; }
    .empty-state p { margin: 0 0 1rem; font-size: 0.95rem; }

    .table-card {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.04);
    }
    .table-header, .table-row {
      display: grid;
      grid-template-columns: 60px 2fr 1.2fr 0.9fr 0.8fr 0.7fr 0.9fr;
      gap: 0.75rem;
      padding: 0.9rem 1.25rem;
      align-items: center;
    }
    .table-header {
      background: var(--green, #0F2A1D);
      color: var(--ivory, #F7F4EC);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .table-row {
      border-bottom: 1px solid var(--ivory-3, #E2DBC9);
      transition: background 0.2s;
      font-size: 0.88rem;
    }
    .table-row:hover { background: var(--ivory-2, #EFEADD); }
    .table-row:last-child { border-bottom: 0; }

    .col-img img {
      width: 48px; height: 48px;
      border-radius: var(--r, 8px);
      object-fit: contain;
      background: var(--ivory, #F7F4EC);
      padding: 4px;
    }
    .col-product strong { display: block; color: var(--ink, #132018); font-weight: 600; }
    .col-product small { color: var(--green-soft, #5C7A68); font-size: 0.72rem; font-family: monospace; }
    .col-category { color: var(--green-soft, #5C7A68); text-transform: capitalize; }
    .col-num { text-align: right; }
    .price { font-weight: 700; color: var(--gold, #C9A44C); }
    .col-bool { font-size: 0.82rem; }
    .col-actions { display: flex; gap: 0.35rem; justify-content: flex-end; }

    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.66rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge--bestseller { background: var(--green, #0F2A1D); color: var(--ivory, #F7F4EC); }
    .badge--new { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .badge--sale { background: #a8443c; color: #fff; }
    .muted { color: var(--ivory-3, #E2DBC9); }

    .status-dot {
      display: inline-block;
      width: 8px; height: 8px;
      border-radius: 50%;
      margin-right: 0.35rem;
      vertical-align: middle;
    }
    .status-dot.is-on { background: #2ecc71; }
    .status-dot.is-off { background: #bdc3c7; }

    .icon-action {
      width: 32px; height: 32px;
      border-radius: var(--r, 8px);
      background: transparent;
      border: 0;
      display: grid; place-items: center;
      cursor: pointer;
      color: var(--green-soft, #5C7A68);
      transition: background 0.2s, color 0.2s;
      text-decoration: none;
    }
    .icon-action:hover { background: var(--ivory-3, #E2DBC9); color: var(--green, #0F2A1D); }
    .icon-action--danger:hover { background: rgba(168, 68, 60, 0.12); color: #a8443c; }

    @media (max-width: 900px) {
      .table-header, .table-row {
        grid-template-columns: 48px 1.5fr 1fr 0.7fr;
      }
      .table-header span:nth-child(n+5),
      .table-row > span:nth-child(n+5) { display: none; }
    }
  `],
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);
  private exportService = inject(ExportService);
  protected readonly i18n = inject(I18nService);

  products = signal<ApiProduct[]>([]);
  categories = signal<ApiCategory[]>([]);
  total = signal(0);
  isLoading = signal(true);
  /** The API's message when the read failed; null when it didn't. */
  loadError = signal<string | null>(null);


  searchTerm = '';
  categoryFilter = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  // Export state
  exportBusy = signal(false);

  // Delete flow
  deleteDialogOpen = signal(false);
  pendingDelete = signal<ApiProduct | null>(null);
  isDeleting = signal(false);

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  // ------------------------------------------------------------
  // Data loading
  // ------------------------------------------------------------
  private loadCategories(): void {
    this.categoryService.list().subscribe({
      next: (res) => this.categories.set(res.categories),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.productService
      .adminList({
        search: this.searchTerm || undefined,
        category: this.categoryFilter || undefined,
        limit: 500,
      })
      .subscribe({
        next: (res) => {
          this.loadError.set(null);
          this.products.set(res.products);
          this.total.set(res.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load products', err);
          this.products.set([]);
          this.total.set(0);
          this.loadError.set(adminErrorDetail(err, this.i18n.t('admin.common.apiDown')));
          this.isLoading.set(false);
          this.toast.show(this.i18n.t('admin.common.loadFailed'));
        },
      });
  }

  onSearchChange(value: string): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.searchTerm = value;
      this.loadProducts();
    }, 300);
  }

  onCategoryChange(value: string): void {
    this.categoryFilter = value;
    this.loadProducts();
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  productName(p: ApiProduct): string {
    return this.i18n.isRTL() ? (p.ar?.name || p.en.name) : p.en.name;
  }

  badgeLabel(badge: string): string {
    switch (badge) {
      case 'bestseller': return this.i18n.t('admin.products.form.bestSeller');
      case 'new': return this.i18n.t('admin.products.form.new');
      case 'sale': return this.i18n.t('admin.products.form.sale');
      default: return badge;
    }
  }

  imgSrc(p: ApiProduct): string {
    return mediaUrl(p, 0);
  }

  onImgError(e: Event): void {
    const img = e.target as HTMLImageElement;
    img.style.opacity = '0.25';
    img.onerror = null;
  }

  categoryName(id: string): string {
    const c = this.categories().find((x) => x.id === id);
    return c ? (this.i18n.isRTL() ? c.ar : c.en) : id;
  }

  // ------------------------------------------------------------
  // ✅ CSV export
  // ------------------------------------------------------------
  exportCsv(): void {
    if (this.exportBusy()) return;
    this.exportBusy.set(true);
    this.exportService.download('products').subscribe({
      next: () => {
        this.exportBusy.set(false);
        this.toast.show(this.i18n.t('admin.orders.header.downloadStarted'));
      },
      error: (err) => {
        this.exportBusy.set(false);
        this.toast.show(err.error?.error || this.i18n.t('admin.orders.header.exportFailed'));
      },
    });
  }

  // ------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------
  confirmDelete(p: ApiProduct): void {
    this.pendingDelete.set(p);
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.pendingDelete.set(null);
  }

  doDelete(): void {
    const product = this.pendingDelete();
    if (!product) return;

    this.isDeleting.set(true);
    this.productService.adminDelete(product.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deleteDialogOpen.set(false);
        this.pendingDelete.set(null);
        this.toast.show(this.i18n.t('admin.products.deleted').replace('{name}', this.productName(product)));
        this.loadProducts();
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.isDeleting.set(false);
        this.toast.show(this.i18n.t('admin.products.header.failedToDeleteProduct'));
      },
    });
  }
}
