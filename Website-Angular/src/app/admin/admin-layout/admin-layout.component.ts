import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService, type User } from '../../services/auth';
import { StorageService } from '../../core/services/storage.service';
import { I18nService } from '../../core/services/i18n.service';
import { ConfirmDialog } from '../ui/confirm-dialog/confirm-dialog';

/** Persists whether the rail is collapsed to an icon-only strip. */
const RAIL_KEY = 'bp_admin_rail';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialog],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly store = inject(StorageService);
  protected readonly i18n = inject(I18nService);

  protected readonly user = signal<User | null>(null);
  protected readonly confirmingLogout = signal(false);
  protected readonly collapsed = signal(this.store.get(RAIL_KEY) === '1');

  constructor() {
    this.auth.user$.subscribe((user) => this.user.set(user));
  }

  protected toggleRail(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    this.store.set(RAIL_KEY, next ? '1' : '0');
  }

  protected logout(): void {
    this.confirmingLogout.set(false);
    this.auth.logout();
  }
}