import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserAdminService, AdminUser } from '../../services/user-admin.service';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { adminErrorDetail } from '../admin-api';

import { LoadingSpinnerComponent } from '../ui/loading-spinner.component';
import { LoadErrorComponent } from '../ui/load-error/load-error.component';
import { ConfirmDialogComponent } from '../ui/confirm-dialog.component';

type RoleFilter = '' | 'admin' | 'customer';
type SortBy = 'created_at' | 'full_name' | 'email' | 'order_count';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    LoadErrorComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="admin-users">
      <!-- Header -->
      <div class="page-head">
        <div>
          <h1 class="h-lg">Users</h1>
          <!-- "0 users · 0 admins" after a failed read is a false claim
               that the admin account is missing. Say nothing instead. -->
          <p class="page-sub" *ngIf="!isLoading() && loadError() === null">
            {{ total() }} user{{ total() === 1 ? '' : 's' }}
            · <span class="admin-count">{{ adminCount() }} admin{{ adminCount() === 1 ? '' : 's' }}</span>
          </p>
          <p class="page-sub" *ngIf="isLoading() || loadError() !== null">—</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="filter-search">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" fill="none"/>
            <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>

        <select class="filter-select" [(ngModel)]="roleFilter" (ngModelChange)="onRoleChange($event)">
          <option value="">All roles</option>
          <option value="admin">Admins</option>
          <option value="customer">Customers</option>
        </select>

        <select class="filter-select" [(ngModel)]="sortBy" (ngModelChange)="onSortChange()">
          <option value="created_at">Newest first</option>
          <option value="full_name">Name (A–Z)</option>
          <option value="email">Email (A–Z)</option>
          <option value="order_count">Most orders</option>
        </select>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="isLoading()" message="Loading users…"></app-loading-spinner>

      <!-- Load failed — shown INSTEAD of the empty state. -->
      <app-load-error
        *ngIf="!isLoading() && loadError() !== null"
        [detail]="loadError()!"
        (retry)="loadUsers()"
      ></app-load-error>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!isLoading() && loadError() === null && users().length === 0">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="currentColor" stroke-width="1.5" fill="none"
                stroke-linecap="round"/>
          <circle cx="12" cy="7" r="4"
                  stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
        <p>No users match your filter.</p>
      </div>

      <!-- Table -->
      <div class="table-card" *ngIf="!isLoading() && loadError() === null && users().length > 0">
        <div class="table-header">
          <span>User</span>
          <span>Contact</span>
          <span class="col-num">Orders</span>
          <span class="col-date">Joined</span>
          <span class="col-role">Role</span>
          <span class="col-actions">Actions</span>
        </div>

        <div class="table-row"
             *ngFor="let u of users(); trackBy: trackById"
             [class.is-self]="isSelf(u)"
             [class.is-admin]="u.is_admin">

          <!-- User -->
          <span class="col-user">
            <span class="avatar" [class.avatar--admin]="u.is_admin">{{ initials(u) }}</span>
            <span class="user-info">
              <strong>
                {{ u.full_name || '(no name)' }}
                <span class="you-badge" *ngIf="isSelf(u)">You</span>
              </strong>
              <small>{{ u.email }}</small>
            </span>
          </span>

          <!-- Contact -->
          <span class="col-contact">
            <small>{{ u.phone || '—' }}</small>
            <small class="muted-line">{{ u.address || 'No address' }}</small>
          </span>

          <!-- Orders -->
          <span class="col-num">
            <span class="order-count" [class.is-zero]="u.order_count === 0">
              {{ u.order_count }}
            </span>
          </span>

          <!-- Joined -->
          <span class="col-date">
            <small>{{ formatDate(u.created_at) }}</small>
          </span>

          <!-- Role -->
          <span class="col-role">
            <span class="role-pill" [class.role-pill--admin]="u.is_admin"
                                    [class.role-pill--customer]="!u.is_admin">
              {{ u.is_admin ? 'Admin' : 'Customer' }}
            </span>
          </span>

          <!-- Actions -->
          <span class="col-actions">
            <button
              *ngIf="!u.is_admin"
              class="btn btn--sm btn--gold"
              (click)="confirmPromote(u)"
              [disabled]="isSelf(u)"
            >
              Make admin
            </button>
            <button
              *ngIf="u.is_admin"
              class="btn btn--sm btn--danger-outline"
              (click)="confirmDemote(u)"
              [disabled]="isSelf(u)"
              [title]="isSelf(u) ? 'You cannot remove your own admin access' : ''"
            >
              Remove admin
            </button>
          </span>
        </div>
      </div>

      <!-- Confirm Role Change Dialog -->
      <app-confirm-dialog
        [isOpen]="roleDialogOpen()"
        [title]="pendingRoleChange()?.to === 'admin' ? 'Make user an admin?' : 'Remove admin access?'"
        [message]="roleDialogMessage()"
        [confirmText]="pendingRoleChange()?.to === 'admin' ? 'Make admin' : 'Remove admin'"
        [variant]="pendingRoleChange()?.to === 'admin' ? 'primary' : 'danger'"
        [isLoading]="isRoleChangeSaving()"
        (confirm)="doRoleChange()"
        (cancel)="cancelRoleChange()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .admin-users { padding: 0; }

    .page-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
    }
    .page-head h1 { margin: 0 0 0.25rem; color: var(--green, #0F2A1D); }
    .page-sub { margin: 0; font-size: 0.88rem; color: var(--green-soft, #5C7A68); }
    .admin-count { color: var(--gold, #C9A44C); font-weight: 700; }

    /* Filters */
    .filters {
      display: flex; gap: 0.75rem; flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .filter-search {
      display: flex; align-items: center; gap: 0.5rem;
      flex: 1 1 280px;
      background: var(--white, #fff);
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      padding: 0 0.9rem;
      transition: border-color 0.3s;
    }
    .filter-search:focus-within { border-color: var(--gold, #C9A44C); }
    .filter-search svg { color: var(--green-soft, #5C7A68); flex-shrink: 0; }
    .filter-search input {
      border: 0; outline: none; flex: 1;
      padding: 0.7rem 0;
      font-size: 0.9rem; font-family: inherit;
      background: transparent; color: var(--ink, #132018);
    }
    .filter-select {
      padding: 0.7rem 1rem;
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      background: var(--white, #fff);
      font-size: 0.88rem; font-family: inherit;
      color: var(--ink, #132018);
      cursor: pointer;
    }
    .filter-select:focus { outline: none; border-color: var(--gold, #C9A44C); }

    /* Empty */
    .empty-state {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--green-soft, #5C7A68);
    }
    .empty-state svg { color: var(--ivory-3, #E2DBC9); margin-bottom: 0.75rem; }
    .empty-state p { margin: 0; font-size: 0.95rem; }

    /* Table */
    .table-card {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.04);
    }
    .table-header, .table-row {
      display: grid;
      grid-template-columns: 2fr 1.4fr 0.7fr 1fr 0.9fr 1.2fr;
      gap: 0.9rem;
      padding: 0.9rem 1.25rem;
      align-items: center;
    }
    .table-header {
      background: var(--green, #0F2A1D);
      color: var(--ivory, #F7F4EC);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .table-row {
      border-bottom: 1px solid var(--ivory-3, #E2DBC9);
      transition: background 0.2s;
      font-size: 0.88rem;
    }
    .table-row:hover { background: var(--ivory-2, #EFEADD); }
    .table-row:last-child { border-bottom: 0; }
    .table-row.is-self { background: rgba(201, 164, 76, 0.06); }
    .table-row.is-self:hover { background: rgba(201, 164, 76, 0.1); }
    .table-row.is-admin { border-left: 3px solid var(--gold, #C9A44C); padding-left: calc(1.25rem - 3px); }

    /* User cell */
    .col-user {
      display: flex; align-items: center; gap: 0.75rem;
      min-width: 0;
    }
    .avatar {
      width: 38px; height: 38px;
      border-radius: 50%;
      background: var(--ivory-3, #E2DBC9);
      color: var(--green, #0F2A1D);
      display: grid; place-items: center;
      font-size: 0.82rem;
      font-weight: 800;
      letter-spacing: 0.03em;
      flex-shrink: 0;
    }
    .avatar--admin {
      background: var(--gold, #C9A44C);
      color: var(--green, #0F2A1D);
    }
    .user-info { min-width: 0; }
    .user-info strong {
      display: flex; align-items: center; gap: 0.4rem;
      color: var(--ink, #132018);
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-info small {
      display: block;
      color: var(--green-soft, #5C7A68);
      font-size: 0.76rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .you-badge {
      font-size: 0.6rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: var(--gold, #C9A44C);
      color: var(--green, #0F2A1D);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    /* Contact */
    .col-contact small {
      display: block;
      color: var(--ink, #132018);
      font-size: 0.8rem;
    }
    .col-contact .muted-line {
      color: var(--green-soft, #5C7A68);
      font-size: 0.72rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 220px;
    }

    /* Orders */
    .col-num { text-align: center; }
    .order-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 32px; height: 26px;
      padding: 0 0.55rem;
      border-radius: 999px;
      background: rgba(46, 204, 113, 0.12);
      color: #1e8449;
      font-size: 0.78rem;
      font-weight: 800;
    }
    .order-count.is-zero {
      background: var(--ivory-2, #EFEADD);
      color: var(--green-soft, #5C7A68);
    }

    /* Date */
    .col-date small {
      color: var(--green-soft, #5C7A68);
      font-size: 0.78rem;
    }

    /* Role pill */
    .col-role { display: flex; }
    .role-pill {
      display: inline-block;
      padding: 0.25rem 0.7rem;
      border-radius: 999px;
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .role-pill--admin { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .role-pill--customer { background: var(--ivory-2, #EFEADD); color: var(--green-soft, #5C7A68); }

    /* Actions */
    .col-actions { display: flex; justify-content: flex-end; }

    /* Buttons */
    .btn {
      padding: 0.5rem 1rem;
      border-radius: var(--r, 8px);
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
      border: 0;
      transition: background 0.3s, transform 0.3s, color 0.3s;
      white-space: nowrap;
    }
    .btn--sm { padding: 0.5rem 0.9rem; }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .btn--gold:hover:not(:disabled) {
      background: var(--gold-lt, #E4C783);
      transform: translateY(-1px);
    }
    .btn--danger-outline {
      background: transparent;
      border: 1.5px solid #a8443c;
      color: #a8443c;
    }
    .btn--danger-outline:hover:not(:disabled) { background: #a8443c; color: #fff; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

    @media (max-width: 1024px) {
      .table-header, .table-row {
        grid-template-columns: 2fr 1fr 0.9fr 1.2fr;
      }
      .table-header span:nth-child(2),
      .table-row > span:nth-child(2),
      .table-header span:nth-child(4),
      .table-row > span:nth-child(4) { display: none; }
    }
    @media (max-width: 640px) {
      .table-header, .table-row {
        grid-template-columns: 1.5fr 0.8fr 1.2fr;
      }
      .table-header span:nth-child(3),
      .table-row > span:nth-child(3) { display: none; }
    }
  `],
})
export class AdminUsersComponent implements OnInit {
  private userAdminService = inject(UserAdminService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  users = signal<AdminUser[]>([]);
  total = signal(0);
  isLoading = signal(true);
  /** The API's message when the read failed; null when it didn't. */
  loadError = signal<string | null>(null);


  searchTerm = '';
  roleFilter: RoleFilter = '';
  sortBy: SortBy = 'created_at';
  sortDir: SortDir = 'desc';

  private searchDebounce?: ReturnType<typeof setTimeout>;

  // Role change dialog state
  roleDialogOpen = signal(false);
  pendingRoleChange = signal<{ user: AdminUser; to: 'admin' | 'customer' } | null>(null);
  isRoleChangeSaving = signal(false);

  adminCount = computed(() => this.users().filter((u) => u.is_admin).length);

  ngOnInit(): void {
    this.loadUsers();
  }

  // ------------------------------------------------------------
  // Load
  // ------------------------------------------------------------
  loadUsers(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.userAdminService
      .list({
        search: this.searchTerm || undefined,
        role: this.roleFilter || undefined,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        limit: 500,
      })
      .subscribe({
        next: (res) => {
          this.loadError.set(null);
          this.users.set(res.users);
          this.total.set(res.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load users', err);
          this.users.set([]);
          this.total.set(0);
          this.loadError.set(adminErrorDetail(err, this.i18n.t('admin.common.apiDown')));
          this.toast.show(this.i18n.t('admin.common.loadFailed'));
          this.isLoading.set(false);
        },
      });
  }

  onSearchChange(value: string): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.searchTerm = value;
      this.loadUsers();
    }, 300);
  }

  onRoleChange(value: RoleFilter): void {
    this.roleFilter = value;
    this.loadUsers();
  }

  onSortChange(): void {
    // Keep DESC for "most orders" and "newest", ASC for alphabetical
    if (this.sortBy === 'full_name' || this.sortBy === 'email') {
      this.sortDir = 'asc';
    } else {
      this.sortDir = 'desc';
    }
    this.loadUsers();
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  trackById(_i: number, u: AdminUser): number {
    return u.id;
  }

  isSelf(u: AdminUser): boolean {
    // Compare with current logged-in user
    const current = this.authService.user$;
    // We need to read the current value synchronously — pull from the subject's value
    // (AuthService uses a BehaviorSubject, so `.value` is safe.)
    const me = (this.authService as any)['userSubject']?.value as { id?: number } | null;
    return me?.id === u.id;
  }

  initials(u: AdminUser): string {
    const name = (u.full_name || u.email || '?').trim();
    const parts = name.split(/[\s@]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ------------------------------------------------------------
  // Role change flow
  // ------------------------------------------------------------
  confirmPromote(u: AdminUser): void {
    this.pendingRoleChange.set({ user: u, to: 'admin' });
    this.roleDialogOpen.set(true);
  }

  confirmDemote(u: AdminUser): void {
    this.pendingRoleChange.set({ user: u, to: 'customer' });
    this.roleDialogOpen.set(true);
  }

  cancelRoleChange(): void {
    this.roleDialogOpen.set(false);
    this.pendingRoleChange.set(null);
  }

  roleDialogMessage(): string {
    const change = this.pendingRoleChange();
    if (!change) return '';
    const name = change.user.full_name || change.user.email;

    if (change.to === 'admin') {
      return `“${name}” will get full access to the admin panel, including products, orders, users and settings.`;
    }
    return `“${name}” will lose all admin access and become a regular customer. Their order history stays intact.`;
  }

  doRoleChange(): void {
    const change = this.pendingRoleChange();
    if (!change) return;

    this.isRoleChangeSaving.set(true);

    const isAdmin = change.to === 'admin';
    this.userAdminService.setRole(change.user.id, isAdmin).subscribe({
      next: (res) => {
        this.isRoleChangeSaving.set(false);
        this.roleDialogOpen.set(false);
        this.pendingRoleChange.set(null);
        this.toast.show(
          isAdmin
            ? `${change.user.full_name || change.user.email} is now an admin`
            : `${change.user.full_name || change.user.email} is no longer an admin`
        );
        this.loadUsers();
      },
      error: (err) => {
        console.error('Role change failed', err);
        this.isRoleChangeSaving.set(false);
        const msg = err.error?.error || 'Failed to change role';
        this.toast.show(msg);
        this.cancelRoleChange();
      },
    });
  }
}