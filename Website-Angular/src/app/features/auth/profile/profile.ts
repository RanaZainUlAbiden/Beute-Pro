import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../services/auth';
import { ToastService } from '../../../core/services/toast.service';
import { OrderService } from '../../../services/order'; // ✅ Import OrderService

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private orderService = inject(OrderService); // ✅ For order count

  user: User | null = null;
  orderCount: number = 0; // ✅ Add orderCount
  profileForm: FormGroup;
  passwordForm: FormGroup;

  isSavingProfile = false;
  isSavingPassword = false;
  profileError = '';
  passwordError = '';
  passwordSuccess = '';

  constructor() {
    this.profileForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      phone: [''],
      address: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordsMatchValidator });
  }

  ngOnInit(): void {
    this.auth.user$.subscribe(user => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          full_name: user.full_name || '',
          phone: user.phone || '',
          address: user.address || '',
        });
        // ✅ Fetch order count if user is logged in
        this.fetchOrderCount();
      }
    });
  }

  /** ✅ Fetch user's order count */
  private fetchOrderCount(): void {
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orderCount = res.orders?.length || 0;
      },
      error: () => {
        this.orderCount = 0; // fallback
      },
    });
  }

  /** Custom validator: check if newPassword and confirmPassword match */
  passwordsMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
  }

  /** Update profile */
  onSubmitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile = true;
    this.profileError = '';

    this.auth.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSavingProfile = false;
        this.toast.show('Profile updated successfully');
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.profileError = err.error?.error || 'Failed to update profile. Please try again.';
        this.toast.show(this.profileError);
      },
    });
  }

  /** Change password */
  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: (res) => {
        this.isSavingPassword = false;
        this.passwordSuccess = res.message || 'Password updated successfully';
        this.passwordForm.reset();
        this.toast.show(this.passwordSuccess);
      },
      error: (err) => {
        this.isSavingPassword = false;
        this.passwordError = err.error?.error || 'Failed to change password.';
        this.toast.show(this.passwordError);
      },
    });
  }

  /** Helper to get form controls for validation in template */
  get pf() { return this.profileForm.controls; }
  get psf() { return this.passwordForm.controls; }

  /** Get user initials for avatar */
  getInitials(): string {
    if (!this.user) return '?';
    const name = this.user.full_name || '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}