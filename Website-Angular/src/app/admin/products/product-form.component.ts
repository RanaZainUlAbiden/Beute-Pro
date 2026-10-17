import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { ApiCategory, ApiProduct } from '../../core/models/api.model';

import { LoadingSpinnerComponent } from '../ui/loading-spinner.component';
import { ProductMediaManagerComponent } from './product-media-manager/product-media-manager.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent, ProductMediaManagerComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  categories = signal<ApiCategory[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  readonly media = signal<ApiProduct['media']>(undefined);

  productId: string | null = null;
  isEditMode = computed(() => this.productId !== null);

  form: FormGroup = this.fb.group({
    id: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    category: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    oldPrice: [null],
    badge: [''],
    size: [''],
    displayOrder: [0, [Validators.min(0)]],
    spin: [false],
    isActive: [true],
    en: this.fb.group({
      name: ['', Validators.required],
      tagline: ['', Validators.required],
      description: ['', Validators.required],
      ingredients: [''],
      benefits: [''],
      usage: [''],
    }),
    ar: this.fb.group({
      name: ['', Validators.required],
      tagline: ['', Validators.required],
      description: ['', Validators.required],
      ingredients: [''],
      benefits: [''],
      usage: [''],
    }),
  });

  get f() { return this.form.controls; }
  get fEn() { return (this.form.get('en') as FormGroup).controls; }
  get fAr() { return (this.form.get('ar') as FormGroup).controls; }

  ngOnInit(): void {
    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId = id;
      this.loadProduct(id);
    } else {
      this.isLoading.set(false);
    }
  }

  private loadCategories(): void {
    this.categoryService.list().subscribe({
      next: (res) => this.categories.set(res.categories),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  private loadProduct(id: string): void {
    this.productService.getById(id).subscribe({
      next: (res) => {
        const p = res.product;
        this.media.set(p.media);
        this.form.patchValue({
          id: p.id,
          category: p.category,
          price: p.price,
          oldPrice: p.oldPrice,
          badge: p.badge || '',
          size: p.size || '',
          displayOrder: p.displayOrder,
          spin: p.spin,
          isActive: p.isActive,
          en: {
            name: p.en.name,
            tagline: p.en.tagline,
            description: p.en.description,
            ingredients: (p.en.ingredients || []).join('\n'),
            benefits: (p.en.benefits || []).join('\n'),
            usage: p.en.usage || '',
          },
          ar: {
            name: p.ar.name,
            tagline: p.ar.tagline,
            description: p.ar.description,
            ingredients: (p.ar.ingredients || []).join('\n'),
            benefits: (p.ar.benefits || []).join('\n'),
            usage: p.ar.usage || '',
          },
        });
        this.form.get('id')?.disable();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load product', err);
        this.toast.show(this.i18n.t('admin.products.form.failedToLoadProduct'));
        this.isLoading.set(false);
        this.router.navigate(['..'], { relativeTo: this.route });
      },
    });
  }

  // ------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show(this.i18n.t('admin.products.form.pleaseFixTheErrorsBeforeSaving'));
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      id: raw.id,
      category: raw.category,
      price: Number(raw.price),
      oldPrice: raw.oldPrice ? Number(raw.oldPrice) : null,
      badge: raw.badge || null,
      size: raw.size || null,
      displayOrder: Number(raw.displayOrder) || 0,
      spin: !!raw.spin,
      isActive: !!raw.isActive,
      en: this.normalizeCopy(raw.en),
      ar: this.normalizeCopy(raw.ar),
    };

    this.isSaving.set(true);

    const request$ = this.isEditMode()
      ? this.productService.adminUpdate(this.productId!, payload)
      : this.productService.adminCreate(payload);

    request$.subscribe({
      next: (res) => {
        this.media.set(res.product.media);
        this.isSaving.set(false);
        this.toast.show(this.isEditMode() ? this.i18n.t('admin.products.form.productUpdated') : this.i18n.t('admin.products.form.productCreated'));
        this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (err) => {
        console.error('Save failed', err);
        this.isSaving.set(false);
        const msg = err.error?.error || this.i18n.t('admin.products.form.failedToSaveProduct');
        this.toast.show(msg);
      },
    });
  }

  /** Turn textarea strings into arrays for ingredients/benefits. */
  private normalizeCopy(copy: any) {
    return {
      name: copy.name.trim(),
      tagline: copy.tagline.trim(),
      description: copy.description.trim(),
      ingredients: this.linesToArray(copy.ingredients),
      benefits: this.linesToArray(copy.benefits),
      usage: (copy.usage || '').trim(),
    };
  }

  private linesToArray(text: string): string[] {
    return (text || '')
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}
