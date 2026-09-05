import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AdminApi, adminDate, type ContactMessage } from '../admin-api';
import { ConfirmDialog } from '../ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import type { TranslationKey } from '../../core/data/i18n.data';

/* =============================================================
   MESSAGES (admin)

   The contact form's inbox. Rows are dense and one click deep:
   the message expands in place rather than opening a screen,
   because reading it and marking it read is the whole task.

   Deleting is permanent and there is no undo behind it, so it
   goes through the confirm dialog and names the sender.
   ============================================================= */
@Component({
  selector: 'app-contact-messages',
  imports: [ConfirmDialog],
  templateUrl: './contact-messages.html',
  styleUrl: './contact-messages.scss',
})
export class ContactMessagesComponent implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  protected readonly date = adminDate;
  protected readonly filters = ['unread', 'read', 'replied'] as const;
  protected readonly statusLabel = (status: string) =>
    this.i18n.t(`admin.messages.status.${status}` as TranslationKey);

  protected readonly messages = signal<readonly ContactMessage[]>([]);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  protected readonly page = signal(1);
  protected readonly limit = 20;
  protected readonly totalPages = signal(1);
  protected readonly total = signal(0);
  protected readonly status = signal('');

  /** The row whose full message is open, and the row waiting to be deleted. */
  protected readonly openId = signal<number | null>(null);
  protected readonly pendingDelete = signal<ContactMessage | null>(null);
  protected readonly deleting = signal(false);

  protected readonly unread = computed(
    () => this.messages().filter((m) => m.status === 'unread').length,
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.messages(this.page(), this.limit, this.status() || undefined).subscribe({
      next: (res) => {
        this.messages.set(res.messages ?? []);
        this.total.set(res.total ?? 0);
        this.totalPages.set(Math.max(1, res.totalPages ?? 1));
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }

  protected onFilter(value: string): void {
    this.status.set(value);
    this.page.set(1);
    this.openId.set(null);
    this.load();
  }

  protected goto(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.openId.set(null);
    this.load();
  }

  protected toggle(message: ContactMessage): void {
    const opening = this.openId() !== message.id;
    this.openId.set(opening ? message.id : null);
    // reading it is what marks it read — one less thing to click
    if (opening && message.status === 'unread') this.setStatus(message, 'read', true);
  }

  protected setStatus(message: ContactMessage, status: string, quiet = false): void {
    this.api.setMessageStatus(message.id, status).subscribe({
      next: () => {
        this.messages.update((list) =>
          list.map((m) => (m.id === message.id ? { ...m, status: status as ContactMessage['status'] } : m)),
        );
        if (!quiet) {
          this.toast.show(this.i18n.t('admin.messages.markedNote').replace('{status}', this.statusLabel(status)));
        }
      },
      error: () => this.toast.show(this.i18n.t('admin.messages.statusErr')),
    });
  }

  protected confirmDelete(): void {
    const message = this.pendingDelete();
    if (!message) return;
    this.deleting.set(true);
    this.api.deleteMessage(message.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.show(this.i18n.t('admin.messages.deletedNote'));
        // the page it came from may now be short a row
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.show(this.i18n.t('admin.messages.deleteErr'));
      },
    });
  }

  protected pillClass(status: string): string {
    switch (status) {
      case 'unread':
        return 'pill pill--pending';
      case 'read':
        return 'pill pill--processing';
      default:
        return 'pill pill--shipped';
    }
  }
}
