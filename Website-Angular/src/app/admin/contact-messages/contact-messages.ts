import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-contact-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contact-messages">
      <h1 class="h-lg">Contact Messages</h1>
      <div class="filters">
        <select (change)="filterStatus($event)" class="filter-select">
          <option value="">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading messages...</p>
      </div>

      <div *ngIf="!loading && messages.length === 0" class="empty-state">
        <p>No messages found.</p>
      </div>

      <div *ngIf="!loading && messages.length > 0" class="messages-table">
        <div class="table-header">
          <span>Name</span>
          <span>Email</span>
          <span>Message</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div *ngFor="let msg of messages" class="table-row">
          <span class="name">{{ msg.name }}</span>
          <span class="email">{{ msg.email }}</span>
          <span class="message">{{ msg.message | slice:0:60 }}{{ msg.message.length > 60 ? '…' : '' }}</span>
          <span class="status-badge" [class]="'status-'+msg.status">{{ msg.status }}</span>
          <div class="actions">
            <select (change)="updateStatus(msg.id, $event)" [value]="msg.status" class="status-select">
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>
            <button (click)="deleteMessage(msg.id)" class="delete-btn" aria-label="Delete">🗑</button>
          </div>
        </div>
      </div>

      <div *ngIf="totalPages > 1" class="pagination">
        <button (click)="changePage(currentPage - 1)" [disabled]="currentPage === 1">Previous</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button (click)="changePage(currentPage + 1)" [disabled]="currentPage === totalPages">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .contact-messages { padding: 1rem; }
    .filters { margin-bottom: 1.5rem; }
    .filter-select, .status-select { padding: 0.4rem 0.8rem; border-radius: var(--r); border: 1px solid var(--ivory-3); background: white; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem 0; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--ivory-3); border-top: 3px solid var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 2rem 0; color: var(--green-soft); }
    .messages-table { background: white; border-radius: var(--r-lg); overflow: hidden; box-shadow: var(--shadow); }
    .table-header, .table-row { display: grid; grid-template-columns: 1.5fr 1.5fr 3fr 1fr 2fr; gap: 1rem; padding: 0.8rem 1.5rem; align-items: center; }
    .table-header { background: var(--green); color: var(--ivory); font-weight: 700; }
    .table-row { border-bottom: 1px solid var(--ivory-3); }
    .name, .email { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .status-badge { padding: 0.2rem 0.6rem; border-radius: var(--r); font-size: 0.7rem; font-weight: 700; text-transform:capitalize; }
    .status-unread { background: #fef3c7; color:#b45309; }
    .status-read { background: #dbeafe; color:#1e40af; }
    .status-replied { background: #d1fae5; color:#065f46; }
    .actions { display: flex; gap: 0.5rem; align-items: center; }
    .delete-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; }
    .pagination { display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem; align-items: center; }
    .pagination button { padding: 0.4rem 1rem; border-radius: var(--r); border: 1px solid var(--ivory-3); background: white; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class ContactMessagesComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  messages: any[] = [];
  loading = true;
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  statusFilter = '';

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.loading = true;
    let url = `${environment.apiUrl}/admin/contact?page=${this.currentPage}&limit=${this.limit}`;
    if (this.statusFilter) {
      url += `&status=${this.statusFilter}`;
    }
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.messages = res.messages;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load messages', err);
        this.loading = false;
      }
    });
  }

  filterStatus(event: any) {
    this.statusFilter = event.target.value;
    this.currentPage = 1;
    this.loadMessages();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadMessages();
  }

  updateStatus(id: number, event: any) {
    const status = event.target.value;
    this.http.put(`${environment.apiUrl}/admin/contact/${id}/status`, { status })
      .subscribe({
        next: () => {
          this.toast.show('Status updated');
          this.loadMessages();
        },
        error: (err) => {
          console.error(err);
          this.toast.show('Failed to update status');
        },
      });
  }

  deleteMessage(id: number) {
    if (!confirm('Delete this message?')) return;
    this.http.delete(`${environment.apiUrl}/admin/contact/${id}`)
      .subscribe({
        next: () => {
          this.toast.show('Message deleted');
          this.loadMessages();
        },
        error: (err) => {
          console.error(err);
          this.toast.show('Failed to delete message');
        },
      });
  }
}