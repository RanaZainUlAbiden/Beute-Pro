import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  isLoginMode = true;
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['']
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.loginForm.reset();
    this.registerForm.reset();
  }

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.isLoginMode) {
      if (this.loginForm.invalid) {
        this.isLoading = false;
        return;
      }
      const { email, password } = this.loginForm.value;
      this.auth.login(email, password).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            if (res.user.is_admin) {
              this.router.navigate([environment.adminPath + '/dashboard']);
            } else {
              this.router.navigate(['/']);
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Login failed. Please try again.';
        }
      });
    } else {
      if (this.registerForm.invalid) {
        this.isLoading = false;
        return;
      }
      this.auth.register(this.registerForm.value).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            if (res.user.is_admin) {
              this.router.navigate([environment.adminPath + '/dashboard']);
            } else {
              this.router.navigate(['/']);
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error || 'Registration failed. Please try again.';
        }
      });
    }
  }

  googleLogin(): void {
    this.auth.loginWithGoogle();
  }
}