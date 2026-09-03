import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/* =============================================================
   localStorage, wrapped

   Every read and write is in a try/catch: Safari private mode and
   similar throw on access rather than returning null. Values fall
   back to an in-memory map so a setting still holds for the
   session. On the server there is no storage at all.
   ============================================================= */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly memory = new Map<string, string>();

  get(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return this.memory.get(key) ?? null;
    }
  }

  set(key: string, value: string): void {
    this.memory.set(key, value);
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      /* memory copy above is the fallback */
    }
  }
}
