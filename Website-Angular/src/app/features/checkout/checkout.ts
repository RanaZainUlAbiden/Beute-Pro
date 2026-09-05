import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../services/order';
import { AuthService, User } from '../../services/auth';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss'],
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cart = inject(CartService);
  private orderService = inject(OrderService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private i18n = inject(I18nService);
  private router = inject(Router);

  user: User | null = null;
  isSubmitting = false;
  checkoutForm: FormGroup;
  paymentMethods = ['cod', 'card', 'bank_transfer'];

  constructor() {
    this.checkoutForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-() ]+$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      paymentMethod: ['cod', Validators.required],
    });
  }

  ngOnInit(): void {
    // Pre-fill form if user is logged in
    this.auth.user$.subscribe(user => {
      this.user = user;
      if (user) {
        this.checkoutForm.patchValue({
          name: user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
        });
      }
    });

    // If cart is empty, redirect to shop
    if (this.cart.count() === 0) {
      this.router.navigate(['/shop']);
      this.toast.show('Your cart is empty. Start shopping!');
    }
  }

  // ✅ Getter for cart rows (signal)
  get cartItems() {
    return this.cart.rows(); // returns the array of CartRow
  }

  // ✅ Getter for total (signal)
  get total() {
    return this.cart.total();
  }

  // ✅ Getter for cart count
  get cartCount(): number {
    return this.cart.count();
  }

  get f() { return this.checkoutForm.controls; }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.toast.show('Please fill in all required fields correctly.');
      return;
    }

    if (this.cartCount === 0) {
      this.toast.show('Your cart is empty.');
      return;
    }

    this.isSubmitting = true;

    const { name, email, phone, address, paymentMethod } = this.checkoutForm.value;

    // Build items array from cart
    const items = this.cartItems.map(row => ({
      productId: row.id,
      quantity: row.qty,
    }));

    const orderData = {
      email,
      phone,
      name,
      address,
      items,
      paymentMethod,
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toast.show('Order placed successfully!');
        this.cart.clear();
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.error || 'Failed to place order. Please try again.';
        this.toast.show(msg);
        console.error('Order error:', err);
      },
    });
  }

  getTotal(): string {
    return this.i18n.money(this.total);
  }

  getItemTotal(row: any): string {
    return this.i18n.money(row.product.price * row.qty);
  }

  formatPrice(price: number): string {
    return this.i18n.money(price);
  }
}