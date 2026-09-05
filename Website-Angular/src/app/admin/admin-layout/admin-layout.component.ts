import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService, type User } from '../../services/auth';
import { ConfirmDialog } from '../ui/confirm-dialog/confirm-dialog';

/* =============================================================
   ADMIN SHELL

   The frame around every admin screen: a green rail with the four
   destinations, who is signed in, and the way out. The working
   area next to it is deliberately plain.

   English only, and `direction:ltr` on `.adm` — these screens are
   internal, their tables are read by column position, and none of
   this copy goes through the i18n tables.

   The rail becomes a horizontal strip of links under 900px, which
   is what makes the tool usable from a phone.
   ============================================================= */
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialog],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);

  protected readonly user = signal<User | null>(null);
  protected readonly confirmingLogout = signal(false);

  constructor() {
    this.auth.user$.subscribe((user) => this.user.set(user));
  }

  protected logout(): void {
    this.confirmingLogout.set(false);
    this.auth.logout();
  }
}
