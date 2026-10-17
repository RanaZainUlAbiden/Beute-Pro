import { I18nService } from '../../core/services/i18n.service';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiCategory } from '../../core/models/api.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" [class.is-open]="isOpen" (click)="onBackdropClick($event)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h3>{{ category ? i18n.t('admin.categories.form.editCategory') : i18n.t('admin.categories.form.newCategory') }}</h3>
          <button class="modal-close" (click)="onCancel()" [attr.aria-label]="i18n.t('admin.categories.form.close')" [disabled]="isSaving()">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" fill="none"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="field">
            <label for="cat-id">{{ i18n.t('admin.categories.form.categoryId') }}</label>
            <input
              id="cat-id"
              type="text"
              formControlName="id"
              [placeholder]="i18n.t('admin.categories.form.eGMists')"
              [readonly]="isEditMode"
            />
            <small class="hint">{{ i18n.t('admin.categories.form.lowercaseDashesOnlyCannotBeChangedAfterCreation') }}</small>
            <div class="error" *ngIf="f['id'].invalid && f['id'].touched">
              {{ i18n.t('admin.categories.form.requiredLowercaseLettersNumbersDashesOnly') }}
            </div>
          </div>

          <div class="field">
            <label for="cat-en">{{ i18n.t('admin.categories.form.englishName') }}</label>
            <input id="cat-en" type="text" dir="ltr" formControlName="en" [placeholder]="i18n.t('admin.categories.form.faceMists')" />
            <div class="error" *ngIf="f['en'].invalid && f['en'].touched">{{ i18n.t('admin.categories.form.required') }}</div>
          </div>

          <div class="field" dir="rtl">
            <label for="cat-ar">{{ i18n.t('admin.categories.form.arabicName') }}</label>
            <input id="cat-ar" type="text" formControlName="ar" [placeholder]="i18n.t('admin.categories.form.arabicExample')" />
            <div class="error" *ngIf="f['ar'].invalid && f['ar'].touched">{{ i18n.t('admin.categories.form.required') }}</div>
          </div>

          <div class="field">
            <label for="cat-img">{{ i18n.t('admin.categories.form.imageUrl') }}</label>
            <input id="cat-img" type="text" formControlName="imageUrl"
                   placeholder="/assets/img/categories/mists.jpg" />
            <small class="hint">{{ i18n.t('admin.categories.form.optionalUsedForTheCategoryTileOnTheShopPage') }}</small>
          </div>

          <div class="field">
            <label for="cat-order">{{ i18n.t('admin.categories.form.displayOrder') }}</label>
            <input id="cat-order" type="number" formControlName="displayOrder" min="0" />
            <small class="hint">{{ i18n.t('admin.categories.form.lowerNumbersShowFirst') }}</small>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn--outline" (click)="onCancel()" [disabled]="isSaving()">
              {{ i18n.t('admin.common.cancel') }}
            </button>
            <button type="submit" class="btn btn--gold" [disabled]="isSaving() || form.invalid">
              {{ isSaving() ? i18n.t('admin.common.saving') : (isEditMode ? i18n.t('admin.categories.form.saveChanges') : i18n.t('admin.categories.form.create')) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(10, 28, 19, 0.65);
      backdrop-filter: blur(4px);
      display: grid; place-items: center;
      padding: 1rem;
      opacity: 0; visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }
    .modal-backdrop.is-open { opacity: 1; visibility: visible; }

    .modal {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg, 0 36px 80px -32px rgba(15, 42, 29, 0.55));
      transform: translateY(12px) scale(0.96);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-backdrop.is-open .modal { transform: translateY(0) scale(1); }

    .modal-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--ivory-3, #E2DBC9);
    }
    .modal-head h3 {
      margin: 0; font-size: 1.1rem; font-weight: 700;
      color: var(--green, #0F2A1D);
    }
    .modal-close {
      background: transparent; border: 0;
      width: 32px; height: 32px;
      display: grid; place-items: center;
      color: var(--green-soft, #5C7A68);
      cursor: pointer; border-radius: var(--r, 8px);
      transition: background 0.2s, color 0.2s;
    }
    .modal-close:hover:not(:disabled) { background: var(--ivory-2, #EFEADD); color: var(--ink, #132018); }
    .modal-close:disabled { opacity: 0.4; cursor: not-allowed; }

    .modal-body {
      padding: 1.5rem;
      display: flex; flex-direction: column; gap: 1rem;
    }

    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .field label {
      font-size: 0.78rem; font-weight: 700;
      color: var(--green, #0F2A1D);
    }
    .field input {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      font-size: 0.9rem; font-family: inherit;
      color: var(--ink, #132018);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .field input:focus {
      outline: none;
      border-color: var(--gold, #C9A44C);
      box-shadow: 0 0 0 3px rgba(201, 164, 76, 0.15);
    }
    .field input[readonly] {
      background: var(--ivory-2, #EFEADD);
      color: var(--green-soft, #5C7A68);
      cursor: not-allowed;
    }
    .hint { font-size: 0.72rem; color: var(--green-soft, #5C7A68); }
    .error { font-size: 0.72rem; color: #a8443c; font-weight: 600; }

    .modal-actions {
      display: flex; justify-content: flex-end; gap: 0.7rem;
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--ivory-3, #E2DBC9);
    }
    .btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.7rem 1.3rem;
      border-radius: var(--r, 8px);
      font-size: 0.82rem; font-weight: 700;
      cursor: pointer; border: 0;
      transition: background 0.3s, transform 0.3s, box-shadow 0.3s;
    }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .btn--gold:hover:not(:disabled) {
      background: var(--gold-lt, #E4C783);
      transform: translateY(-1px);
      box-shadow: 0 10px 20px -10px rgba(201, 164, 76, 0.7);
    }
    .btn--gold:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn--outline {
      background: transparent;
      border: 1.5px solid var(--green, #0F2A1D);
      color: var(--green, #0F2A1D);
    }
    .btn--outline:hover:not(:disabled) { background: var(--green, #0F2A1D); color: var(--ivory, #F7F4EC); }
    .btn--outline:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class CategoryFormComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  /** Whether the modal is visible. Parent controls this. */
  @Input() isOpen = false;

  /** When set, the form is in edit mode for this category. */
  @Input() category: ApiCategory | null = null;

  /** Suggested display order when creating a new category. */
  @Input() suggestedOrder = 0;

  @Output() saved = new EventEmitter<ApiCategory>();
  @Output() cancelled = new EventEmitter<void>();

  isSaving = signal(false);

  form: FormGroup = this.fb.group({
    id: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    en: ['', Validators.required],
    ar: ['', Validators.required],
    imageUrl: [''],
    displayOrder: [0, [Validators.min(0)]],
  });

  get f() { return this.form.controls; }
  get isEditMode(): boolean { return this.category !== null; }

  ngOnInit(): void {
    this.resetForm();
  }

  ngOnChanges(): void {
    if (this.isOpen) this.resetForm();
  }

  private resetForm(): void {
    if (this.category) {
      this.form.reset({
        id: this.category.id,
        en: this.category.en,
        ar: this.category.ar,
        imageUrl: this.category.imageUrl || '',
        displayOrder: this.category.displayOrder,
      });
      this.form.get('id')?.disable();
    } else {
      this.form.reset({
        id: '',
        en: '',
        ar: '',
        imageUrl: '',
        displayOrder: this.suggestedOrder,
      });
      this.form.get('id')?.enable();
    }
  }

  onBackdropClick(e: MouseEvent): void {
    if (this.isSaving()) return;
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancel();
    }
  }

  onCancel(): void {
    if (this.isSaving()) return;
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      id: raw.id,
      en: raw.en.trim(),
      ar: raw.ar.trim(),
      imageUrl: raw.imageUrl?.trim() || null,
      displayOrder: Number(raw.displayOrder) || 0,
    };

    this.isSaving.set(true);

    const request$ = this.isEditMode
      ? this.categoryService.adminUpdate(this.category!.id, {
          en: payload.en,
          ar: payload.ar,
          imageUrl: payload.imageUrl,
          displayOrder: payload.displayOrder,
        })
      : this.categoryService.adminCreate(payload);

    request$.subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        this.toast.show(this.isEditMode ? this.i18n.t('admin.categories.form.categoryUpdated') : this.i18n.t('admin.categories.form.categoryCreated'));
        this.saved.emit(res.category);
      },
      error: (err) => {
        console.error('Save category failed', err);
        this.isSaving.set(false);
        const msg = err.error?.error || this.i18n.t('admin.categories.form.failedToSaveCategory');
        this.toast.show(msg);
      },
    });
  }
}