import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/services/i18n.service';
import { AuthService, type User } from '../../../services/auth';

/* =============================================================
   ACCOUNT MENU (in the topbar)

   The signed-in half of the topbar's first slot. It renders on
   the header's dark ground, so the trigger is light-on-green and
   the panel is the same white card the account pages use.

   Closed, the panel is `visibility:hidden` rather than merely
   transparent, so it is out of the tab order between uses.
   ============================================================= */
@Component({
  selector: 'app-profile-dropdown',
  imports: [RouterLink],
  templateUrl: './profile-dropdown.html',
  styleUrl: './profile-dropdown.scss',
})
export class ProfileDropdownComponent {
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);

  protected readonly open = signal(false);
  protected readonly user = signal<User | null>(null);

  private readonly root = viewChild<ElementRef<HTMLElement>>('root');

  constructor() {
    this.auth.user$.subscribe((user) => this.user.set(user));
  }

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected logout(): void {
    this.close();
    this.auth.logout();
  }

  protected initials(): string {
    const name = this.user()?.full_name?.trim() ?? '';
    if (!name) return '?';
    const parts = name.split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!this.open()) return;
    const el = this.root()?.nativeElement;
    if (el && !el.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }
}
