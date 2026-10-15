import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-backdrop" [class.is-open]="isOpen" (click)="onBackdropClick($event)">
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="dialog-icon" [class.is-danger]="variant === 'danger'">
          <svg *ngIf="variant === 'danger'" viewBox="0 0 24 24" width="28" height="28">
            <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  stroke="currentColor" stroke-width="1.8" fill="none"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg *ngIf="variant !== 'danger'" viewBox="0 0 24 24" width="28" height="28">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8" fill="none"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round"/>
          </svg>
        </div>

        <h3 class="dialog-title">{{ title }}</h3>
        <p class="dialog-message">{{ message }}</p>

        <div class="dialog-actions">
          <button class="btn btn--outline" (click)="cancel.emit()" [disabled]="isLoading">
            {{ cancelText }}
          </button>
          <button
            class="btn"
            [class.btn--gold]="variant !== 'danger'"
            [class.btn--danger]="variant === 'danger'"
            (click)="confirm.emit()"
            [disabled]="isLoading"
          >
            {{ isLoading ? 'Working…' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: rgba(10, 28, 19, 0.65);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      padding: 1rem;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .dialog-backdrop.is-open {
      opacity: 1;
      visibility: visible;
    }
    .dialog {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 2rem 1.75rem 1.5rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: var(--shadow-lg, 0 36px 80px -32px rgba(15,42,29,0.55));
      transform: translateY(12px) scale(0.96);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dialog-backdrop.is-open .dialog {
      transform: translateY(0) scale(1);
    }
    .dialog-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 1rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: rgba(201, 164, 76, 0.15);
      color: var(--gold, #C9A44C);
    }
    .dialog-icon.is-danger {
      background: rgba(168, 68, 60, 0.12);
      color: #a8443c;
    }
    .dialog-title {
      margin: 0 0 0.5rem;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--green, #0F2A1D);
    }
    .dialog-message {
      margin: 0 0 1.5rem;
      font-size: 0.92rem;
      line-height: 1.6;
      color: var(--green-soft, #5C7A68);
    }
    .dialog-actions {
      display: flex;
      gap: 0.7rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .dialog-actions .btn {
      flex: 1 1 140px;
      min-width: 120px;
    }
    .btn--danger {
      background: #a8443c;
      color: #fff;
    }
    .btn--danger:hover {
      background: #8a2e2a;
      box-shadow: 0 14px 28px -14px rgba(168, 68, 60, 0.6);
    }
    .btn--danger:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
    }
  `],
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() variant: 'primary' | 'danger' = 'primary';
  @Input() isLoading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('dialog-backdrop') && !this.isLoading) {
      this.cancel.emit();
    }
  }
}