import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import type { TranslationKey } from '../../core/data/i18n.data';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService, type User } from '../../services/auth';
import { OrderService } from '../../services/order';

interface PayMethod {
  id: string;
  label: TranslationKey;
  note: TranslationKey;
}

/* =============================================================
   CHECKOUT

   Delivery details on one side, the cart on the other. An empty
   cart is a state on this page rather than a redirect to /shop —
   being bounced to another page mid-task reads as a fault.

   The visitor's own details pre-fill the form when they are
   signed in, and the form stays editable: this order may be
   going somewhere else.
   ============================================================= */
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
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  protected readonly form: FormGroup;
  protected readonly busy = signal(false);
  protected readonly formError = signal('');
  protected user: User | null = null;

  protected readonly rows = this.cart.rows;
  protected readonly count = this.cart.count;
  protected readonly total = this.cart.total;
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
      // only fill what the visitor has not already typed
      const patch: Record<string, string> = {};
      if (!this.form.value.name) patch['name'] = user.full_name || '';
      if (!this.form.value.email) patch['email'] = user.email || '';
      if (!this.form.value.phone) patch['phone'] = user.phone || '';
      if (!this.form.value.address) patch['address'] = user.address || '';
      this.form.patchValue(patch);
    });
  }

  protected showError(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected errorFor(name: string): string {
    const c = this.form.get(name);
    if (!c || c.valid) return '';
    const required = !!c.errors?.['required'];
    switch (name) {
      case 'name':
        return this.i18n.t('auth.err.name');
      case 'email':
        return this.i18n.t(required ? 'auth.err.email.empty' : 'auth.err.email.format');
      case 'phone':
        return this.i18n.t('auth.err.phone');
      case 'address':
        return this.i18n.t('checkout.err.address');
      default:
        return '';
    }
  }

  protected lineTotal(price: number, qty: number): string {
    return this.i18n.money(price * qty);
  }

  protected money(amount: number): string {
    return this.i18n.money(amount);
  }

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
      })
      .subscribe({
        next: (res) => {
          this.busy.set(false);
          this.cart.clear();
          this.toast.show(this.i18n.t('checkout.ok'));
          /* Signed in, the receipt lives at /orders/:number. A guest has
             no account to read it from, so they go to the public tracker
             with the number already filled in. */
          const number = res.order?.order_number;
          if (number && !this.user) {
            this.router.navigate(['/track'], { queryParams: { number } });
          } else {
            this.router.navigate(number ? ['/orders', number] : ['/orders']);
          }
        },
        error: () => {
          this.busy.set(false);
          this.formError.set(this.i18n.t('checkout.err.submit'));
        },
      });
  }
}
