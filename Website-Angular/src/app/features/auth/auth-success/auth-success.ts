import { Component, afterNextRender, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { I18nService } from '../../../core/services/i18n.service';
import { AuthService } from '../../../services/auth';

/* =============================================================
   /auth/success — the Google round trip lands here

   A held frame, not a page: it exchanges the token in the query
   string for a profile and moves on. It still looks like the
   site, because a blank white flash mid-sign-in is exactly what
   a hijacked redirect looks like.

   The exchange waits for the browser. This route is prerendered
   with everything else, and the build has no token to exchange.
   ============================================================= */
@Component({
  selector: 'app-auth-success',
  templateUrl: './auth-success.html',
  styleUrl: './auth-success.scss',
})
export class AuthSuccessComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);

  constructor() {
    afterNextRender(() => this.exchange());
  }

  private exchange(): void {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get('token');

    if (params.get('error') || !token) {
      this.failed();
      return;
    }

    this.auth.completeExternalLogin(token).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => this.failed(),
    });
  }

  private failed(): void {
    this.router.navigate(['/login'], { queryParams: { error: 'google' } });
  }
}
