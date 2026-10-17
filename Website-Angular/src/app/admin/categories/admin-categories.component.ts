import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { adminErrorDetail } from '../admin-api';
import { ApiCategory } from '../../core/models/api.model';

import { LoadingSpinnerComponent } from '../ui/loading-spinner.component';
import { LoadErrorComponent } from '../ui/load-error/load-error.component';
import { ConfirmDialogComponent } from '../ui/confirm-dialog.component';
import { CategoryFormComponent } from './category-form.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    LoadErrorComponent,
    ConfirmDialogComponent,
    CategoryFormComponent,
  ],
  template: `
    <div class="admin-categories">
      <!-- Header -->
      <div class="page-head">
        <div>
          <h1 class="h-lg">{{ i18n.t('admin.nav.categories') }}</h1>
          <!-- A count is a claim about the data; don't make one when the
               read failed. "—" is honest, "0 categories" is not. -->
          <p class="page-sub" *ngIf="!isLoading() && loadError() === null">
            {{ i18n.t('admin.categories.header.count').replace('{count}', categories().length.toString()) }}
          </p>
          <p class="page-sub" *ngIf="isLoading() || loadError() !== null">—</p>
        </div>
        <button class="btn btn--gold" (click)="openCreate()">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" fill="none"/>
          </svg>
          {{ i18n.t('admin.categories.header.addCategory') }}
        </button>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="isLoading()" [message]="i18n.t('admin.categories.header.loadingCategories')"></app-loading-spinner>

      <!-- Load failed — shown INSTEAD of the empty state, so a dead
           API never reads as an empty catalogue. -->
      <app-load-error
        *ngIf="!isLoading() && loadError() !== null"
        [detail]="loadError()!"
        (retry)="loadCategories()"
      ></app-load-error>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!isLoading() && loadError() === null && categories().length === 0">
        <p>{{ i18n.t('admin.categories.header.noCategoriesYet') }}</p>
        <button class="btn btn--gold" (click)="openCreate()">{{ i18n.t('admin.categories.header.createTheFirstOne') }}</button>
      </div>

      <!-- Grid -->
      <div class="cat-grid" *ngIf="!isLoading() && loadError() === null && categories().length > 0">
        <div class="cat-card" *ngFor="let c of categories()">
          <div class="cat-card__order">
            <span class="order-num">{{ c.displayOrder }}</span>
            <span class="order-label">{{ i18n.t('admin.categories.header.order') }}</span>
          </div>

          <div class="cat-card__body">
            <div class="cat-card__id">{{ c.id }}</div>
            <div class="cat-card__names">
              <div class="name-en">
                <span class="lang-chip">{{ i18n.t('admin.categories.header.en') }}</span>
                {{ c.en }}
              </div>
              <div class="name-ar" dir="rtl">
                <span class="lang-chip">{{ i18n.t('admin.categories.header.ar') }}</span>
                {{ c.ar }}
              </div>
            </div>
          </div>

          <div class="cat-card__actions">
            <button class="icon-action" [title]="i18n.t('admin.common.edit')" (click)="openEdit(c)">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      stroke="currentColor" stroke-width="1.8" fill="none"
                      stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
                      stroke="currentColor" stroke-width="1.8" fill="none"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="icon-action icon-action--danger" [title]="i18n.t('admin.media.delete')" (click)="confirmDelete(c)">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
                      stroke="currentColor" stroke-width="1.8" fill="none"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ─────── Form modal ─────── -->
      <app-category-form
        [isOpen]="formOpen()"
        [category]="editing()"
        [suggestedOrder]="nextDisplayOrder()"
        (saved)="onFormSaved($event)"
        (cancelled)="closeForm()"
      ></app-category-form>

      <!-- ─────── Delete confirm ─────── -->
      <app-confirm-dialog
        [isOpen]="deleteDialogOpen()"
        [title]="i18n.t('admin.categories.header.deleteCategory')"
        [message]="i18n.t('admin.categories.deleteMessage').replace('{name}', (i18n.isRTL() ? pendingDelete()?.ar : pendingDelete()?.en) || '')"
        [confirmText]="i18n.t('admin.media.delete')"
        variant="danger"
        [isLoading]="isDeleting()"
        (confirm)="doDelete()"
        (cancel)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .admin-categories { padding: 0; }

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

    .btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.7rem 1.3rem;
      border-radius: var(--r, 8px);
      font-size: 0.82rem; font-weight: 700;
      cursor: pointer; border: 0;
      transition: background 0.3s, transform 0.3s, box-shadow 0.3s;
    }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .btn--gold:hover { background: var(--gold-lt, #E4C783); transform: translateY(-1px); box-shadow: 0 10px 20px -10px rgba(201, 164, 76, 0.7); }

    .empty-state {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--green-soft, #5C7A68);
    }
    .empty-state p { margin: 0 0 1rem; font-size: 0.95rem; }

    .cat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.1rem;
    }
    .cat-card {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 1.2rem 1.3rem;
      display: grid;
      grid-template-columns: 48px 1fr auto;
      gap: 1rem;
      align-items: start;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.04);
      border: 1px solid transparent;
      transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
    }
    .cat-card:hover {
      border-color: var(--gold, #C9A44C);
      transform: translateY(-2px);
      box-shadow: 0 10px 24px -10px rgba(15, 42, 29, 0.15);
    }

    .cat-card__order {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: var(--ivory-2, #EFEADD);
      border-radius: var(--r, 8px);
      padding: 0.5rem 0.2rem;
      height: 52px;
    }
    .order-num {
      font-size: 1.2rem; font-weight: 800;
      color: var(--gold, #C9A44C);
      line-height: 1;
    }
    .order-label {
      font-size: 0.6rem; font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--green-soft, #5C7A68);
      margin-top: 2px;
    }

    .cat-card__body { min-width: 0; }
    .cat-card__id {
      font-family: monospace;
      font-size: 0.72rem;
      color: var(--green-soft, #5C7A68);
      margin-bottom: 0.4rem;
    }
    .cat-card__names { display: flex; flex-direction: column; gap: 0.35rem; }
    .name-en, .name-ar {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.92rem; font-weight: 600;
      color: var(--ink, #132018);
      min-width: 0;
    }
    .name-ar { direction: rtl; justify-content: flex-end; }
    .lang-chip {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 18px;
      background: var(--green, #0F2A1D); color: var(--ivory, #F7F4EC);
      border-radius: 4px;
      font-size: 0.58rem; font-weight: 800;
      letter-spacing: 0.06em;
      flex-shrink: 0;
    }

    .cat-card__actions { display: flex; gap: 0.25rem; }
    .icon-action {
      width: 32px; height: 32px;
      border-radius: var(--r, 8px);
      background: transparent; border: 0;
      display: grid; place-items: center;
      cursor: pointer;
      color: var(--green-soft, #5C7A68);
      transition: background 0.2s, color 0.2s;
    }
    .icon-action:hover { background: var(--ivory-3, #E2DBC9); color: var(--green, #0F2A1D); }
    .icon-action--danger:hover { background: rgba(168, 68, 60, 0.12); color: #a8443c; }
  `],
})
export class AdminCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  categories = signal<ApiCategory[]>([]);
  isLoading = signal(true);
  /** The API's message when the read failed; null when it didn't. */
  loadError = signal<string | null>(null);

  // Form modal state
  formOpen = signal(false);
  editing = signal<ApiCategory | null>(null);

  // Delete state
  deleteDialogOpen = signal(false);
  pendingDelete = signal<ApiCategory | null>(null);
  isDeleting = signal(false);

  ngOnInit(): void {
    this.loadCategories();
  }

  // ------------------------------------------------------------
  loadCategories(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.categoryService.list().subscribe({
      next: (res) => {
        this.loadError.set(null);
        this.categories.set(res.categories);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.toast.show(this.i18n.t('admin.common.loadFailed'));
        // Drop any stale rows: a half-rendered list behind an error
        // panel is the ambiguity this fix exists to remove.
        this.categories.set([]);
        this.loadError.set(adminErrorDetail(err, this.i18n.t('admin.common.apiDown')));
        this.isLoading.set(false);
      },
    });
  }

  // ------------------------------------------------------------
  // Modal
  openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  openEdit(c: ApiCategory): void {
    this.editing.set(c);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  onFormSaved(_c: ApiCategory): void {
    this.closeForm();
    this.loadCategories();
  }

  nextDisplayOrder(): number {
    const max = this.categories().reduce((m, c) => Math.max(m, c.displayOrder), 0);
    return max + 1;
  }

  // ------------------------------------------------------------
  // Delete
  confirmDelete(c: ApiCategory): void {
    this.pendingDelete.set(c);
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.pendingDelete.set(null);
  }

  doDelete(): void {
    const c = this.pendingDelete();
    if (!c) return;

    this.isDeleting.set(true);
    this.categoryService.adminDelete(c.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deleteDialogOpen.set(false);
        this.pendingDelete.set(null);
        this.toast.show(this.i18n.t('admin.categories.deleted').replace('{name}', this.i18n.isRTL() ? c.ar : c.en));
        this.loadCategories();
      },
      error: (err) => {
        console.error('Delete category failed', err);
        this.isDeleting.set(false);
        const msg = err.error?.error || this.i18n.t('admin.categories.header.failedToDeleteCategory');
        this.toast.show(msg);
        this.cancelDelete();
      },
    });
  }
}