import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-wrapper" [class.is-inline]="inline">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      <p *ngIf="message" class="spinner-msg">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.8rem;
      padding: 3rem 1rem;
    }
    .spinner-wrapper.is-inline {
      padding: 0;
      flex-direction: row;
      gap: 0.5rem;
    }
    .spinner {
      border: 3px solid var(--ivory-3, #E2DBC9);
      border-top-color: var(--gold, #C9A44C);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    .spinner-msg {
      margin: 0;
      font-size: 0.88rem;
      color: var(--green-soft, #5C7A68);
      font-weight: 500;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class LoadingSpinnerComponent {
  @Input() size = 40;
  @Input() message = '';
  @Input() inline = false;
}