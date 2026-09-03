import { Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import type { PageData } from './app.routes';
import { AudioService } from './core/services/audio.service';
import { I18nService } from './core/services/i18n.service';
import { LayoutService } from './core/services/layout.service';
import { ScrollService } from './core/services/scroll.service';
import { BackToTop } from './shared/back-to-top/back-to-top';
import { CartDrawer } from './shared/cart-drawer/cart-drawer';
import { Footer } from './shared/footer/footer';
import { Header } from './shared/header/header';
import { ProgressBar } from './shared/progress-bar/progress-bar';
import { Toast } from './shared/toast/toast';
import { WhatsappButton } from './shared/whatsapp-button/whatsapp-button';

/* =============================================================
   THE SHELL

   Everything the seven static pages repeated byte-for-byte —
   header, mobile panel, footer, cart drawer, toast, the two
   floating buttons and the <audio> element — lives here once.
   The routed page drops in between the header and the footer.
   ============================================================= */
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [
    RouterOutlet,
    ProgressBar,
    Header,
    Footer,
    BackToTop,
    WhatsappButton,
    CartDrawer,
    Toast,
  ],
})
export class App {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly audio = inject(AudioService);
  private readonly scroll = inject(ScrollService);
  protected readonly layout = inject(LayoutService);
  protected readonly i18n = inject(I18nService);

  private readonly audioEl = viewChild.required<ElementRef<HTMLAudioElement>>('audioEl');

  constructor() {
    this.applyPage();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.applyPage();
        // the new page has a different height, so the progress bar and
        // the back-to-top threshold both need re-measuring
        this.scroll.update();
      });

    afterNextRender(() => this.audio.init(this.audioEl().nativeElement));
  }

  /** Body classes and <meta description> for the route now showing. */
  private applyPage(): void {
    let leaf = this.route;
    while (leaf.firstChild) leaf = leaf.firstChild;
    const data = leaf.snapshot.data as Partial<PageData>;

    this.layout.setNoHero(data.noHero ?? true);
    this.layout.progress.set(data.progress ?? true);

    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
    } else {
      this.meta.removeTag("name='description'");
    }
  }
}
