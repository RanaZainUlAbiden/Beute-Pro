import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CouponService } from '../../services/coupon.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiCoupon, DiscountType } from '../../core/models/api.model';

@Component({
  selector: 'app-coupon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" [class.is-open]="isOpen" (click)="onBackdropClick($event)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h3>{{ coupon ? 'Edit coupon' : 'New coupon' }}</h3>
          <button class="modal-close" (click)="onCancel()" aria-label="Close" [disabled]="isSaving()">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" fill="none"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <!-- Code -->
          <div class="field">
            <label for="cp-code">Coupon code *</label>
            <input
              id="cp-code"
              type="text"
              formControlName="code"
              placeholder="e.g. WELCOME10"
              [readonly]="isEditMode"
              style="text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;"
            />
            <small class="hint" *ngIf="!isEditMode">Letters, numbers, dashes. Will be uppercased.</small>
            <small class="hint" *ngIf="isEditMode">Code cannot be changed after creation.</small>
            <div class="error" *ngIf="f['code'].invalid && f['code'].touched">
              Required. Use letters, numbers and dashes only (min 3 chars).
            </div>
          </div>

          <!-- Discount type + value -->
          <div class="row-2">
            <div class="field">
              <label for="cp-type">Discount type *</label>
              <select id="cp-type" formControlName="discountType">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (Rs)</option>
              </select>
            </div>

            <div class="field">
              <label for="cp-value">
                {{ f['discountType'].value === 'percentage' ? 'Percentage off' : 'Amount off (Rs)' }} *
              </label>
              <input id="cp-value" type="number" formControlName="discountValue" min="0" step="1" />
              <div class="error" *ngIf="f['discountValue'].invalid && f['discountValue'].touched">
                Must be a positive number
              </div>
              <div class="error" *ngIf="f['discountType'].value === 'percentage' && f['discountValue'].value > 100">
                Percentage cannot exceed 100
              </div>
            </div>
          </div>

          <!-- Min order -->
          <div class="field">
            <label for="cp-min">Minimum order value (Rs)</label>
            <input id="cp-min" type="number" formControlName="minOrderValue" min="0" step="1" />
            <small class="hint">Cart must be at least this amount. Leave 0 for no minimum.</small>
          </div>

          <!-- Max uses -->
          <div class="field">
            <label for="cp-max">Usage limit</label>
            <input id="cp-max" type="number" formControlName="maxUses" min="1" />
            <small class="hint">Leave empty for unlimited uses.</small>
          </div>

          <!-- Expiry -->
          <div class="field">
            <label for="cp-exp">Expires on</label>
            <input id="cp-exp" type="date" formControlName="expiresAtDate" />
            <small class="hint">Leave empty for no expiry.</small>
          </div>

          <!-- Active -->
          <label class="toggle">
            <input type="checkbox" formControlName="isActive" />
            <span>Active — customers can use this coupon</span>
          </label>

          <!-- Preview -->
          <div class="preview" *ngIf="form.valid">
            <span class="preview-label">Preview</span>
            <span class="preview-text">
              <b>{{ f['code'].value | uppercase }}</b> gives
              <b>{{ previewDiscount() }}</b>
              off orders over <b>₨ {{ (f['minOrderValue'].value || 0) | number }}</b>
            </span>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn--outline" (click)="onCancel()" [disabled]="isSaving()">
              Cancel
            </button>
            <button type="submit" class="btn btn--gold" [disabled]="isSaving() || form.invalid">
              {{ isSaving() ? 'Saving…' : (isEditMode ? 'Save changes' : 'Create coupon') }}
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
      max-width: 540px;
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
    .modal-head h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--green, #0F2A1D); }
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

    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.9rem;
    }

    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .field label { font-size: 0.78rem; font-weight: 700; color: var(--green, #0F2A1D); }
    .field input,
    .field select {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      font-size: 0.9rem; font-family: inherit;
      color: var(--ink, #132018);
      background: var(--white, #fff);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .field input:focus,
    .field select:focus {
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

    .toggle {
      display: flex; align-items: center; gap: 0.55rem;
      font-size: 0.88rem; font-weight: 600;
      color: var(--green, #0F2A1D);
      cursor: pointer;
      padding: 0.6rem 0;
    }
    .toggle input[type="checkbox"] {
      width: 18px; height: 18px;
      accent-color: var(--gold, #C9A44C);
      cursor: pointer;
    }

    .preview {
      display: flex; flex-direction: column; gap: 0.3rem;
      padding: 0.9rem 1rem;
      border-radius: var(--r, 8px);
      background: rgba(201, 164, 76, 0.1);
      border-left: 3px solid var(--gold, #C9A44C);
    }
    .preview-label {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--gold, #C9A44C);
    }
    .preview-text { font-size: 0.85rem; color: var(--ink, #132018); line-height: 1.5; }
    .preview-text b { color: var(--green, #0F2A1D); }

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
      transition: background 0.3s, transform 0.3s;
    }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .btn--gold:hover:not(:disabled) {
      background: var(--gold-lt, #E4C783);
      transform: translateY(-1px);
    }
    .btn--gold:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn--outline {
      background: transparent;
      border: 1.5px solid var(--green, #0F2A1D);
      color: var(--green, #0F2A1D);
    }
    .btn--outline:hover:not(:disabled) { background: var(--green, #0F2A1D); color: var(--ivory, #F7F4EC); }
    .btn--outline:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 520px) {
      .row-2 { grid-template-columns: 1fr; }
    }
  `],
})
export class CouponFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private couponService = inject(CouponService);
  private toast = inject(ToastService);

  @Input() isOpen = false;
  @Input() coupon: ApiCoupon | null = null;

  @Output() saved = new EventEmitter<ApiCoupon>();
  @Output() cancelled = new EventEmitter<void>();

  isSaving = signal(false);

  form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    discountType: ['percentage' as DiscountType, Validators.required],
    discountValue: [0, [Validators.required, Validators.min(0)]],
    minOrderValue: [0, [Validators.min(0)]],
    maxUses: [null],
    expiresAtDate: [''],
    isActive: [true],
  });

  get f() { return this.form.controls; }
  get isEditMode(): boolean { return this.coupon !== null; }

  ngOnInit(): void {
    this.resetForm();
  }

  ngOnChanges(): void {
    if (this.isOpen) this.resetForm();
  }

  private resetForm(): void {
    if (this.coupon) {
      this.form.reset({
        code: this.coupon.code,
        discountType: this.coupon.discountType,
        discountValue: this.coupon.discountValue,
        minOrderValue: this.coupon.minOrderValue,
        maxUses: this.coupon.maxUses,
        expiresAtDate: this.coupon.expiresAt ? this.coupon.expiresAt.slice(0, 10) : '',
        isActive: this.coupon.isActive,
      });
      this.form.get('code')?.disable();
    } else {
      this.form.reset({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: 0,
        maxUses: null,
        expiresAtDate: '',
        isActive: true,
      });
      this.form.get('code')?.enable();
    }
  }

  previewDiscount(): string {
    const val = Number(this.f['discountValue'].value) || 0;
    return this.f['discountType'].value === 'percentage' ? `${val}%` : `₨ ${val}`;
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
    // Extra check: percentage cannot exceed 100
    if (this.f['discountType'].value === 'percentage' && this.f['discountValue'].value > 100) {
      this.toast.show('Percentage discount cannot exceed 100');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      code: raw.code.toUpperCase().trim(),
      discountType: raw.discountType as DiscountType,
      discountValue: Number(raw.discountValue),
      minOrderValue: Number(raw.minOrderValue) || 0,
      maxUses: raw.maxUses ? Number(raw.maxUses) : null,
      expiresAt: raw.expiresAtDate ? new Date(raw.expiresAtDate).toISOString() : null,
      isActive: !!raw.isActive,
    };

    this.isSaving.set(true);

    const request$ = this.isEditMode
      ? this.couponService.adminUpdate(this.coupon!.code, {
          discountType: payload.discountType,
          discountValue: payload.discountValue,
          minOrderValue: payload.minOrderValue,
          maxUses: payload.maxUses,
          expiresAt: payload.expiresAt,
          isActive: payload.isActive,
        })
      : this.couponService.adminCreate(payload);

    request$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.toast.show(this.isEditMode ? 'Coupon updated' : 'Coupon created');
        this.saved.emit(res.coupon);
      },
      error: (err) => {
        console.error('Save coupon failed', err);
        this.isSaving.set(false);
        const msg = err.error?.error || 'Failed to save coupon';
        this.toast.show(msg);
      },
    });
  }
}