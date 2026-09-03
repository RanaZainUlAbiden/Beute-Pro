import { Injectable, signal } from '@angular/core';

/* The confirmation strip at the bottom of the screen. One at a
   time; a second message restarts the 2.6s clock. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly text = signal('');
  readonly visible = signal(false);

  private timer: ReturnType<typeof setTimeout> | undefined;

  show(message: string): void {
    this.text.set(message);
    this.visible.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.visible.set(false), 2600);
  }
}
