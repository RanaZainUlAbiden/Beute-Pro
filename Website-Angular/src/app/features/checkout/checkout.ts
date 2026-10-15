import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import type { TranslationKey } from '../../core/data/i18n.data';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService, type User } from '../../services/auth';
import { OrderService } from '../../services/order';
import { CouponService } from '../../services/coupon.service';

interface PayMethod {
  id: string;
  label: TranslationKey;
  note: TranslationKey;
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);
  private readonly coupons = inject(CouponService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  protected readonly form: FormGroup;
  protected readonly busy = signal(false);
  protected readonly formError = signal('');
  protected user: User | null = null;

  // ✅ Coupon state
  protected readonly couponInput = signal('');
  protected readonly appliedCode = signal<string | null>(null);
  protected readonly appliedDiscount = signal(0);
  protected readonly couponBusy = signal(false);
  protected readonly couponError = signal('');

  protected readonly rows = this.cart.rows;
  protected readonly count = this.cart.count;
  protected readonly total = this.cart.total;

  /** Total after any applied coupon discount. */
  protected readonly discountedTotal = computed(() =>
    Math.max(0, this.total() - this.appliedDiscount())
  );

  protected readonly empty = computed(() => this.cart.count() === 0);

  protected readonly methods: readonly PayMethod[] = [
    { id: 'cod', label: 'checkout.pay.cod', note: 'checkout.pay.cod.note' },
    { id: 'card', label: 'checkout.pay.card', note: 'checkout.pay.card.note' },
    { id: 'bank_transfer', label: 'checkout.pay.bank', note: 'checkout.pay.bank.note' },
  ] as const;

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-()]{7,}$/)]],
      address: ['', [Validators.required, Validators.minLength(8)]],
      paymentMethod: ['cod', Validators.required],
    });
  }

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => {
      this.user = user;
      if (!user) return;
      const patch: Record<string, string> = {};
      if (!this.form.value.name) patch['name'] = user.full_name || '';
      if (!this.form.value.email) patch['email'] = user.email || '';
      if (!this.form.value.phone) patch['phone'] = user.phone || '';
      if (!this.form.value.address) patch['address'] = user.address || '';
      this.form.patchValue(patch);
    });
  }

  // ------------------------------------------------------------
  // Coupon
  // ------------------------------------------------------------
  protected applyCoupon(): void {
    const code = this.couponInput().trim().toUpperCase();
    if (!code || this.couponBusy()) return;

    this.couponBusy.set(true);
    this.couponError.set('');

    this.coupons.validate(code, this.total()).subscribe({
      next: (res) => {
        this.couponBusy.set(false);
        if (!res.valid) {
          this.couponError.set(res.reason || 'Invalid coupon');
          this.appliedCode.set(null);
          this.appliedDiscount.set(0);
          return;
        }
        this.appliedCode.set(code);
        this.appliedDiscount.set(res.discount);
        this.couponInput.set('');
        this.toast.show(
          this.i18n.isRTL()
            ? `تم تطبيق الخصم: ${this.i18n.money(res.discount)}`
            : `Coupon applied — you saved ${this.i18n.money(res.discount)}`
        );
      },
      error: (err) => {
        this.couponBusy.set(false);
        this.couponError.set(err.error?.error || 'Could not verify coupon');
        this.appliedCode.set(null);
        this.appliedDiscount.set(0);
      },
    });
  }

  protected removeCoupon(): void {
    this.appliedCode.set(null);
    this.appliedDiscount.set(0);
    this.couponError.set('');
    this.couponInput.set('');
  }

  // ------------------------------------------------------------
  // Form helpers
  // ------------------------------------------------------------
  protected showError(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected errorFor(name: string): string {
    const c = this.form.get(name);
    if (!c || c.valid) return '';
    const required = !!c.errors?.['required'];
    switch (name) {
      case 'name':   return this.i18n.t('auth.err.name');
      case 'email':  return this.i18n.t(required ? 'auth.err.email.empty' : 'auth.err.email.format');
      case 'phone':  return this.i18n.t('auth.err.phone');
      case 'address':return this.i18n.t('checkout.err.address');
      default:       return '';
    }
  }

  protected lineTotal(price: number, qty: number): string {
    return this.i18n.money(price * qty);
  }

  protected money(amount: number): string {
    return this.i18n.money(amount);
  }

  // ------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------
  protected submit(): void {
    if (this.busy() || this.empty()) return;

    this.formError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set(this.i18n.t('checkout.err.form'));
      return;
    }

    this.busy.set(true);
    const { name, email, phone, address, paymentMethod } = this.form.value;

    this.orders
      .createOrder({
        name,
        email,
        phone,
        address,
        paymentMethod,
        items: this.cart.rows().map((row) => ({ productId: row.id, quantity: row.qty })),
        couponCode: this.appliedCode() ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.busy.set(false);
          this.cart.clear();
          this.toast.show(this.i18n.t('checkout.ok'));
          const number = res.order?.order_number;
          if (number && !this.user) {
            this.router.navigate(['/track'], { queryParams: { number } });
          } else {
            this.router.navigate(number ? ['/orders', number] : ['/orders']);
          }
        },
        error: (err) => {
          this.busy.set(false);
          this.formError.set(err.error?.error || this.i18n.t('checkout.err.submit'));
        },
      });
  }
}