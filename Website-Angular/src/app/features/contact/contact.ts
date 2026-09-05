import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { RevealDirective } from '../../core/directives/reveal.directive';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHero } from '../../shared/page-hero/page-hero';
import type { SplitSegment } from '../../shared/split-heading/split-heading';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, PageHero],
})
export class Contact {
  protected readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);

  protected readonly heroTitle = computed<SplitSegment[]>(() => [
    { text: this.i18n.t('contact.t1') },
    { text: this.i18n.t('contact.t2'), class: 'accent' },
  ]);

  protected send(e: Event): void {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    if (!name || !email || !message) {
      this.toast.show('Please fill in all fields.');
      return;
    }

    // Simple email validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      this.toast.show('Please enter a valid email address.');
      return;
    }

    this.http.post(`${environment.apiUrl}/contact`, { name, email, message })
      .subscribe({
        next: () => {
          this.toast.show(this.i18n.t('contact.toast'));
          form.reset();
        },
        error: (err) => {
          console.error('Contact submission error:', err);
          this.toast.show('Something went wrong. Please try again later.');
        },
      });
  }
}