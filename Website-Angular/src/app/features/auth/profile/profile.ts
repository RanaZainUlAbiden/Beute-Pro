import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService, type User } from '../../../services/auth';
import { OrderService } from '../../../services/order';

/* =============================================================
   YOUR DETAILS

   Two forms that fail independently, so each carries its own
   error, its own success line and its own busy button — a failed
   password change must not look like a failed address change.

   The email address is rendered as a disabled field rather than
   left out: it is the one thing on the page a visitor looks for,
   and an explained lock beats an absence.
   ============================================================= */
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly orders = inject(OrderService);
  protected readonly i18n = inject(I18nService);

  protected readonly user = signal<User | null>(null);
  protected readonly orderCount = signal<number | null>(null);

  protected readonly detailsForm: FormGroup;
  protected readonly passwordForm: FormGroup;

  protected readonly savingDetails = signal(false);
  protected readonly savedDetails = signal(false);
  protected readonly detailsError = signal('');

  protected readonly savingPassword = signal(false);
  protected readonly savedPassword = signal('');
  protected readonly passwordError = signal('');

  constructor() {
    this.detailsForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^\+?[0-9\s\-()]{7,}$/)]],
      address: [''],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: matchPasswords },
    );
  }

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => {
      this.user.set(user);
      if (!user) return;
      this.detailsForm.patchValue({
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      this.orders.getMyOrders().subscribe({
        next: (res) => this.orderCount.set(res.orders?.length ?? 0),
        error: () => this.orderCount.set(null),
      });
    });
  }

  protected showError(form: FormGroup, name: string): boolean {
    const c = form.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected errorFor(form: FormGroup, name: string): string {
    const c = form.get(name);
    if (!c || c.valid) return '';
    switch (name) {
      case 'full_name':
        return this.i18n.t('auth.err.name');
      case 'phone':
        return this.i18n.t('auth.err.phone');
      case 'currentPassword':
        return this.i18n.t('profile.err.current');
      case 'newPassword':
        return this.i18n.t(c.errors?.['required'] ? 'auth.err.password.empty' : 'auth.err.password.short');
      default:
        return '';
    }
  }

  protected get mismatch(): boolean {
    const confirm = this.passwordForm.get('confirmPassword');
    return this.passwordForm.hasError('mismatch') && !!confirm?.touched;
  }

  protected saveDetails(): void {
    if (this.savingDetails()) return;
    this.detailsError.set('');
    this.savedDetails.set(false);

    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }

    this.savingDetails.set(true);
    this.auth.updateProfile(this.detailsForm.value).subscribe({
      next: () => {
        this.savingDetails.set(false);
        this.savedDetails.set(true);
        this.detailsForm.markAsPristine();
        this.toast.show(this.i18n.t('profile.saved'));
      },
      error: () => {
        this.savingDetails.set(false);
        this.detailsError.set(this.i18n.t('profile.err.save'));
      },
    });
  }

  protected savePassword(): void {
    if (this.savingPassword()) return;
    this.passwordError.set('');
    this.savedPassword.set('');

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.savedPassword.set(this.i18n.t('profile.pwd.ok'));
        this.passwordForm.reset();
        this.toast.show(this.i18n.t('profile.pwd.ok'));
      },
      error: () => {
        this.savingPassword.set(false);
        this.passwordError.set(this.i18n.t('profile.err.pwd'));
      },
    });
  }

  /** Two letters for the avatar; "?" until the user arrives. */
  protected initials(): string {
    const name = this.user()?.full_name?.trim() ?? '';
    if (!name) return '?';
    const parts = name.split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
  }

  protected memberSince(): string {
    const at = this.user()?.created_at;
    if (!at) return '—';
    return new Date(at).toLocaleDateString(this.i18n.isRTL() ? 'ar-EG' : 'en-GB', {
      year: 'numeric',
      month: 'long',
    });
  }
}

/** The two new-password fields have to agree before the form is valid. */
function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const next = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return next && confirm && next !== confirm ? { mismatch: true } : null;
}
