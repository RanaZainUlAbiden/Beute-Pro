import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-auth-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="auth-success">
      <div class="loading-spinner"></div>
      <p>Authenticating...</p>
    </div>
  `,
  styles: [`
    .auth-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--ivory);
      gap: 1rem;
    }
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--ivory-3);
      border-top: 3px solid var(--gold);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AuthSuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];
      if (error) {
        this.router.navigate(['/login'], { queryParams: { error: 'Google authentication failed' } });
        return;
      }
      if (token) {
        // Store token and fetch user
        localStorage.setItem('beute_token', token);
        this.auth.getCurrentUser().subscribe({
          next: (user) => {
            localStorage.setItem('beute_user', JSON.stringify(user));
            this.auth['userSubject'].next(user);
            this.router.navigate(['/']);
          },
          error: () => {
            this.router.navigate(['/login'], { queryParams: { error: 'Failed to fetch user profile' } });
          }
        });
      } else {
        this.router.navigate(['/login'], { queryParams: { error: 'No token received' } });
      }
    });
  }
}