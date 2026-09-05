import { Component, ElementRef, HostListener, inject, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../../services/auth';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-dropdown.html',
  styleUrls: ['./profile-dropdown.scss'],
})
export class ProfileDropdownComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isOpen = false;
  user: User | null = null;

  // Element refs for click outside detection
  private dropdownRef = viewChild<ElementRef>('dropdownContainer');

  constructor() {
    this.auth.user$.subscribe(user => {
      this.user = user;
    });
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  close(): void {
    this.isOpen = false;
  }

  logout(): void {
    this.close();
    this.auth.logout();
  }

  goToOrders(): void {
    this.close();
    this.router.navigate(['/orders']);
  }

  goToProfile(): void {
    this.close();
    this.router.navigate(['/profile']);
  }

  // Click outside to close
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const container = this.dropdownRef()?.nativeElement;
    if (container && !container.contains(event.target)) {
      this.close();
    }
  }

  // Escape key to close
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

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