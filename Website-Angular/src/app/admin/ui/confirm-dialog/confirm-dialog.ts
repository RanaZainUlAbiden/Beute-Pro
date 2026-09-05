import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { LayoutService } from '../../../core/services/layout.service';
import { I18nService } from '../../../core/services/i18n.service';

/* =============================================================
   CONFIRM DIALOG (admin)

   Destructive admin actions ask first. Deliberately not
   window.confirm(): it blocks the tab, it cannot say what will
   be deleted, and it looks like a browser fault rather than a
   decision the tool is offering.

   Rendered by the caller behind an @if, so it is created when it
   opens — which is what lets it take focus on the safe button and
   hand the page's scroll lock back on close.
   ============================================================= */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  private readonly layout = inject(LayoutService);
  protected readonly i18n = inject(I18nService);

  readonly heading = input.required<string>();
  readonly body = input('');
  /** Empty means "use the translated default" — set so every caller doesn't have to pass one. */
  readonly confirmLabel = input('');
  readonly cancelLabel = input('');
  /** Whether the confirming button is the destructive one. */
  readonly danger = input(true);
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly dismissed = output<void>();

  private readonly cancelBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');

  constructor() {
    this.layout.lock();
    inject(DestroyRef).onDestroy(() => this.layout.unlock());
    // focus lands on the safe choice, never on the destructive one
    afterNextRender(() => this.cancelBtn()?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.busy()) this.dismissed.emit();
  }
}
