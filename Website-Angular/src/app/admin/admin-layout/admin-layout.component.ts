import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
// ✅ Correct import – your auth service file is 'auth.ts' (not 'auth.service.ts')
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-brand">Béute Pro Admin</div>
        <nav class="sidebar-nav">
          <a routerLink="dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="orders" routerLinkActive="active">Orders</a>
          <a routerLink="revenue" routerLinkActive="active">Revenue</a>
          <a (click)="logout()" style="cursor:pointer; margin-top:2rem;">Logout</a>
        </nav>
      </aside>
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { display: flex; min-height: 100vh; background: var(--ivory); }
    .admin-sidebar { width: 240px; background: var(--green); color: var(--ivory); padding: 1.5rem; display: flex; flex-direction: column; }
    .sidebar-brand { font-size: 1.2rem; font-weight: 800; color: var(--gold); margin-bottom: 2rem; }
    .sidebar-nav { display: flex; flex-direction: column; gap: 0.5rem; }
    .sidebar-nav a { padding: 0.6rem 1rem; border-radius: var(--r); color: rgba(247,244,236,0.8); transition: background 0.3s; }
    .sidebar-nav a:hover, .sidebar-nav a.active { background: rgba(247,244,236,0.15); color: var(--ivory); }
    .admin-content { flex: 1; padding: 2rem; overflow-y: auto; }
  `],
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  logout() { this.auth.logout(); }
}