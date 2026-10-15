import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiCategory } from '../../core/models/api.model';

import { LoadingSpinnerComponent } from '../ui/loading-spinner.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="product-form">
      <!-- Header -->
      <div class="page-head">
        <div>
          <a routerLink=".." class="back-link">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2"
                    fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Back to products
          </a>
          <h1 class="h-lg">{{ isEditMode() ? 'Edit product' : 'New product' }}</h1>
        </div>
      </div>

      <app-loading-spinner *ngIf="isLoading()" message="Loading…"></app-loading-spinner>

      <form *ngIf="!isLoading()" [formGroup]="form" (ngSubmit)="onSubmit()" class="form-body">
        <!-- ─────── Basic info ─────── -->
        <section class="form-section">
          <h2 class="section-title">Basic info</h2>

          <div class="form-grid">
            <div class="field">
              <label for="id">Product ID *</label>
              <input
                id="id"
                type="text"
                formControlName="id"
                placeholder="e.g. rose-water-mist"
                [readonly]="isEditMode()"
              />
              <small class="hint">Lowercase, dashes only. Cannot be changed after creation.</small>
              <div class="error" *ngIf="f['id'].invalid && f['id'].touched">
                Required. Use lowercase letters, numbers, and dashes.
              </div>
            </div>

            <div class="field">
              <label for="category">Category *</label>
              <select id="category" formControlName="category">
                <option value="" disabled>Select a category</option>
                <option *ngFor="let c of categories()" [value]="c.id">{{ c.en }}</option>
              </select>
              <div class="error" *ngIf="f['category'].invalid && f['category'].touched">
                Category is required
              </div>
            </div>

            <div class="field">
              <label for="price">Price (PKR) *</label>
              <input id="price" type="number" formControlName="price" min="0" step="1" />
              <div class="error" *ngIf="f['price'].invalid && f['price'].touched">
                Price must be a positive number
              </div>
            </div>

            <div class="field">
              <label for="oldPrice">Old price (PKR)</label>
              <input id="oldPrice" type="number" formControlName="oldPrice" min="0" step="1" />
              <small class="hint">Leave empty for no strike-through price.</small>
            </div>

            <div class="field">
              <label for="badge">Badge</label>
              <select id="badge" formControlName="badge">
                <option value="">None</option>
                <option value="bestseller">Best seller</option>
                <option value="new">New</option>
                <option value="sale">Sale</option>
              </select>
            </div>

            <div class="field">
              <label for="size">Size</label>
              <input id="size" type="text" formControlName="size" placeholder="120 ml (4.06 OZ)" />
            </div>

            <div class="field">
              <label for="images">Images count</label>
              <input id="images" type="number" formControlName="images" min="1" max="10" />
              <small class="hint">Number of photos available (1–10).</small>
            </div>

            <div class="field">
              <label for="displayOrder">Display order</label>
              <input id="displayOrder" type="number" formControlName="displayOrder" min="0" />
              <small class="hint">Lower numbers show first.</small>
            </div>
          </div>

          <div class="form-grid form-grid--toggles">
            <label class="toggle">
              <input type="checkbox" formControlName="spin" />
              <span>Has 360° video</span>
            </label>
            <label class="toggle">
              <input type="checkbox" formControlName="isActive" />
              <span>Active (visible on site)</span>
            </label>
          </div>
        </section>

        <!-- ─────── Media ─────── -->
        <section class="form-section">
          <h2 class="section-title">Media</h2>
          <div class="form-grid form-grid--2">
            <div class="field">
              <label for="mediaBaseUrl">Images base URL</label>
              <input id="mediaBaseUrl" type="text" formControlName="mediaBaseUrl" />
              <small class="hint">
                Full URL where <code>{{ f['id'].value || '&lt;id&gt;' }}-1.png</code> lives.
              </small>
            </div>
            <div class="field">
              <label for="videoBaseUrl">Video base URL</label>
              <input id="videoBaseUrl" type="text" formControlName="videoBaseUrl" />
              <small class="hint">
                Full URL where <code>{{ f['id'].value || '&lt;id&gt;' }}.mp4</code> lives.
              </small>
            </div>
          </div>
        </section>

        <!-- ─────── English copy ─────── -->
        <section class="form-section">
          <h2 class="section-title">
            <span class="lang-flag">EN</span> English content
          </h2>

          <div formGroupName="en" class="form-grid">
            <div class="field">
              <label for="en-name">Name *</label>
              <input id="en-name" type="text" formControlName="name" />
              <div class="error" *ngIf="fEn['name'].invalid && fEn['name'].touched">Required</div>
            </div>

            <div class="field">
              <label for="en-tagline">Tagline *</label>
              <input id="en-tagline" type="text" formControlName="tagline" />
              <div class="error" *ngIf="fEn['tagline'].invalid && fEn['tagline'].touched">Required</div>
            </div>

            <div class="field field--full">
              <label for="en-desc">Description *</label>
              <textarea id="en-desc" rows="4" formControlName="description"></textarea>
              <div class="error" *ngIf="fEn['description'].invalid && fEn['description'].touched">Required</div>
            </div>

            <div class="field">
              <label for="en-ing">Ingredients <small>(one per line)</small></label>
              <textarea id="en-ing" rows="5" formControlName="ingredients"></textarea>
            </div>

            <div class="field">
              <label for="en-ben">Benefits <small>(one per line)</small></label>
              <textarea id="en-ben" rows="5" formControlName="benefits"></textarea>
            </div>

            <div class="field field--full">
              <label for="en-usage">How to use</label>
              <textarea id="en-usage" rows="3" formControlName="usage"></textarea>
            </div>
          </div>
        </section>

        <!-- ─────── Arabic copy ─────── -->
        <section class="form-section" dir="rtl">
          <h2 class="section-title">
            <span class="lang-flag">AR</span> المحتوى العربي
          </h2>

          <div formGroupName="ar" class="form-grid">
            <div class="field">
              <label for="ar-name">الاسم *</label>
              <input id="ar-name" type="text" formControlName="name" />
              <div class="error" *ngIf="fAr['name'].invalid && fAr['name'].touched">مطلوب</div>
            </div>

            <div class="field">
              <label for="ar-tagline">الوصف المختصر *</label>
              <input id="ar-tagline" type="text" formControlName="tagline" />
              <div class="error" *ngIf="fAr['tagline'].invalid && fAr['tagline'].touched">مطلوب</div>
            </div>

            <div class="field field--full">
              <label for="ar-desc">الوصف *</label>
              <textarea id="ar-desc" rows="4" formControlName="description"></textarea>
              <div class="error" *ngIf="fAr['description'].invalid && fAr['description'].touched">مطلوب</div>
            </div>

            <div class="field">
              <label for="ar-ing">المكونات <small>(عنصر واحد في كل سطر)</small></label>
              <textarea id="ar-ing" rows="5" formControlName="ingredients"></textarea>
            </div>

            <div class="field">
              <label for="ar-ben">الفوائد <small>(عنصر واحد في كل سطر)</small></label>
              <textarea id="ar-ben" rows="5" formControlName="benefits"></textarea>
            </div>

            <div class="field field--full">
              <label for="ar-usage">طريقة الاستخدام</label>
              <textarea id="ar-usage" rows="3" formControlName="usage"></textarea>
            </div>
          </div>
        </section>

        <!-- ─────── Actions ─────── -->
        <div class="form-actions">
          <a class="btn btn--outline" routerLink="..">Cancel</a>
          <button type="submit" class="btn btn--gold" [disabled]="isSaving()">
            {{ isSaving() ? 'Saving…' : (isEditMode() ? 'Save changes' : 'Create product') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .product-form { padding: 0; }
    .page-head { margin-bottom: 1.5rem; }
    .page-head h1 { margin: 0.4rem 0 0; color: var(--green, #0F2A1D); }
    .back-link {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.8rem; font-weight: 600;
      color: var(--green-soft, #5C7A68);
      text-decoration: none;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--green, #0F2A1D); }

    .form-body { display: flex; flex-direction: column; gap: 1.5rem; }

    .form-section {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 1.75rem 1.75rem 1.5rem;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.04);
    }
    .section-title {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 1rem; font-weight: 700;
      color: var(--green, #0F2A1D);
      margin: 0 0 1.25rem;
    }
    .lang-flag {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 22px;
      background: var(--gold, #C9A44C); color: var(--green, #0F2A1D);
      border-radius: 4px;
      font-size: 0.65rem; font-weight: 800;
      letter-spacing: 0.06em;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem 1.25rem;
    }
    .form-grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .form-grid--toggles {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px dashed var(--ivory-3, #E2DBC9);
    }

    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .field--full { grid-column: 1 / -1; }

    .field label {
      font-size: 0.78rem; font-weight: 700;
      color: var(--green, #0F2A1D);
    }
    .field label small {
      font-weight: 500; color: var(--green-soft, #5C7A68);
      text-transform: none; letter-spacing: 0;
    }
    .field input[type="text"],
    .field input[type="number"],
    .field select,
    .field textarea {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      background: var(--white, #fff);
      font-size: 0.9rem;
      font-family: inherit;
      color: var(--ink, #132018);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .field textarea {
      resize: vertical;
      min-height: 80px;
      line-height: 1.55;
    }
    .field input:focus,
    .field select:focus,
    .field textarea:focus {
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
    .hint code {
      background: var(--ivory-2, #EFEADD);
      padding: 1px 5px; border-radius: 4px;
      font-size: 0.7rem;
    }
    .error { font-size: 0.72rem; color: #a8443c; font-weight: 600; }

    .toggle {
      display: flex; align-items: center; gap: 0.55rem;
      font-size: 0.88rem; font-weight: 600;
      color: var(--green, #0F2A1D);
      cursor: pointer;
    }
    .toggle input[type="checkbox"] {
      width: 18px; height: 18px;
      accent-color: var(--gold, #C9A44C);
      cursor: pointer;
    }

    .form-actions {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding: 0.5rem 0;
    }
    .btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.75rem 1.6rem;
      border-radius: var(--r, 8px);
      font-size: 0.85rem; font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.3s, transform 0.3s, box-shadow 0.3s;
    }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); border: 0; }
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
    .btn--outline:hover { background: var(--green, #0F2A1D); color: var(--ivory, #F7F4EC); }

    @media (max-width: 640px) {
      .form-grid, .form-grid--2 { grid-template-columns: 1fr; }
      .form-section { padding: 1.25rem; }
    }
  `],
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  categories = signal<ApiCategory[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  productId: string | null = null;
  isEditMode = computed(() => this.productId !== null);

  form: FormGroup = this.fb.group({
    id: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    category: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    oldPrice: [null],
    badge: [''],
    size: [''],
    images: [1, [Validators.min(1), Validators.max(10)]],
    displayOrder: [0, [Validators.min(0)]],
    spin: [false],
    isActive: [true],
    mediaBaseUrl: ['/assets/img/products'],
    videoBaseUrl: ['/assets/video/spin'],
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
        this.form.patchValue({
          id: p.id,
          category: p.category,
          price: p.price,
          oldPrice: p.oldPrice,
          badge: p.badge || '',
          size: p.size || '',
          images: p.images,
          displayOrder: p.displayOrder,
          spin: p.spin,
          isActive: p.isActive,
          mediaBaseUrl: p.mediaBaseUrl || '/assets/img/products',
          videoBaseUrl: p.videoBaseUrl || '/assets/video/spin',
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
        this.toast.show('Failed to load product');
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
      this.toast.show('Please fix the errors before saving');
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
      images: Number(raw.images) || 1,
      displayOrder: Number(raw.displayOrder) || 0,
      spin: !!raw.spin,
      isActive: !!raw.isActive,
      mediaBaseUrl: raw.mediaBaseUrl || undefined,
      videoBaseUrl: raw.videoBaseUrl || undefined,
      en: this.normalizeCopy(raw.en),
      ar: this.normalizeCopy(raw.ar),
    };

    this.isSaving.set(true);

    const request$ = this.isEditMode()
      ? this.productService.adminUpdate(this.productId!, payload)
      : this.productService.adminCreate(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.show(this.isEditMode() ? 'Product updated' : 'Product created');
        this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (err) => {
        console.error('Save failed', err);
        this.isSaving.set(false);
        const msg = err.error?.error || 'Failed to save product';
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