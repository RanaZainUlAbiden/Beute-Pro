import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { I18nService } from '../../../core/services/i18n.service';
import { AuthService } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

type Mode = 'signin' | 'register';

/* =============================================================
   SIGN IN / CREATE ACCOUNT

   One page, two forms, switched by a segmented control rather
   than by two routes — the two sets of fields overlap almost
   entirely and a visitor who guessed wrong should not lose a
   page load over it. /login is the only entry point, so the
   switch keeps its own state and never touches the URL.

   Every message the visitor can hit is a translation key, and
   every field error names the fix rather than the rule: the
   password error says "needs at least 6 characters", not
   "invalid".
   ============================================================= */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  protected readonly mode = signal<Mode>('signin');
  protected readonly busy = signal(false);
  /** Set on success, so the button can say so before the route changes. */
  protected readonly done = signal(false);
  /** A form-level message — a rejected sign-in, or a failed Google round trip. */
  protected readonly formError = signal('');
  protected readonly reveal = signal(false);

  protected readonly signinForm: FormGroup;
  protected readonly registerForm: FormGroup;

  protected readonly title = computed(() =>
    this.i18n.t(this.mode() === 'signin' ? 'auth.signin.title' : 'auth.register.title'),
  );
  protected readonly subtitle = computed(() =>
    this.i18n.t(this.mode() === 'signin' ? 'auth.signin.sub' : 'auth.register.sub'),
  );
  protected readonly submitLabel = computed(() => {
    if (this.done()) {
      return this.i18n.t(this.mode() === 'signin' ? 'auth.ok.signin' : 'auth.ok.register');
    }
    if (this.busy()) {
      return this.i18n.t(this.mode() === 'signin' ? 'auth.busy.signin' : 'auth.busy.register');
    }
    return this.i18n.t(this.mode() === 'signin' ? 'auth.submit.signin' : 'auth.submit.register');
  });

  constructor() {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[0-9\s\-()]{7,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: [''],
    });

    // /auth/success bounces failed Google round trips back here with ?error=
    if (this.route.snapshot.queryParamMap.has('error')) {
      this.formError.set(this.i18n.t('auth.err.google'));
    }
  }

  protected form(): FormGroup {
    return this.mode() === 'signin' ? this.signinForm : this.registerForm;
  }

  protected setMode(next: Mode): void {
    if (this.mode() === next) return;
    this.mode.set(next);
    this.formError.set('');
    this.reveal.set(false);
  }

  /** An error is shown once the visitor has left the field, never while typing. */
  protected showError(form: FormGroup, name: string): boolean {
    const c = form.get(name);
    return !!c && c.invalid && c.touched;
  }

  /** The fix, in plain language — not the name of the rule that failed. */
  protected errorFor(form: FormGroup, name: string): string {
    const c: AbstractControl | null = form.get(name);
    if (!c || c.valid) return '';
    const required = !!c.errors?.['required'];
    switch (name) {
      case 'email':
        return this.i18n.t(required ? 'auth.err.email.empty' : 'auth.err.email.format');
      case 'password':
        return this.i18n.t(required ? 'auth.err.password.empty' : 'auth.err.password.short');
      case 'full_name':
        return this.i18n.t('auth.err.name');
      case 'phone':
        return this.i18n.t('auth.err.phone');
      default:
        return '';
    }
  }

  protected submit(): void {
    if (this.busy() || this.done()) return;

    const form = this.form();
    this.formError.set('');

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    const signingIn = this.mode() === 'signin';
    const request = signingIn
      ? this.auth.login(this.signinForm.value.email, this.signinForm.value.password)
      : this.auth.register(this.registerForm.value);

    request.subscribe({
      next: (res) => {
        this.busy.set(false);
        if (!res.success) {
          this.formError.set(this.i18n.t(signingIn ? 'auth.err.signin' : 'auth.err.register'));
          return;
        }
        this.done.set(true);
        this.router.navigate([res.user.is_admin ? `/${environment.adminPath}/dashboard` : '/']);
      },
      error: () => {
        this.busy.set(false);
        this.formError.set(this.i18n.t(signingIn ? 'auth.err.signin' : 'auth.err.register'));
      },
    });
  }

  protected googleLogin(): void {
    this.auth.loginWithGoogle();
  }
}
