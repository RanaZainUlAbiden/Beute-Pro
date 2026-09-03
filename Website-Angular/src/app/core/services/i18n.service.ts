import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

import { T, type TranslationKey } from '../data/i18n.data';
import { CURRENCY } from '../data/products';
import { isLang, type Lang } from '../models/i18n';
import type { Category, Product, ProductCopy } from '../models/product';
import { StorageService } from './storage.service';

/* =============================================================
   LANGUAGE

   The EN/AR tables in core/data/i18n.data.ts are the source of
   truth; this service is only the switch. `lang` is a signal, so
   every template that calls t() re-renders on a change — which is
   what replaces applyLang()'s walk over [data-i18n] attributes.
   ============================================================= */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly doc = inject(DOCUMENT);
  private readonly store = inject(StorageService);

  readonly lang = signal<Lang>('en');
  readonly isRTL = computed(() => this.lang() === 'ar');
  /** Label on the language button: 'ع' while in English, 'EN' while in Arabic. */
  readonly toggleLabel = computed(() => (this.isRTL() ? 'EN' : 'ع'));

  constructor() {
    const saved = this.store.get('bp_lang');
    if (isLang(saved)) this.lang.set(saved);

    effect(() => {
      const lang = this.lang();
      const el = this.doc.documentElement;
      el.lang = lang;
      el.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  toggle(): void {
    this.set(this.lang() === 'en' ? 'ar' : 'en');
  }

  set(next: Lang): void {
    this.lang.set(next);
    this.store.set('bp_lang', next);
  }

  /** Missing translations fall back to English, then to the raw key. */
  t(key: TranslationKey): string {
    const lang = this.lang();
    return T[lang][key] ?? T.en[key] ?? key;
  }

  /** The active-language half of a product. */
  copy(p: Product): ProductCopy {
    return this.isRTL() ? p.ar : p.en;
  }

  /** The active-language name of a category. */
  catName(c: Category | undefined): string {
    if (!c) return '';
    return this.isRTL() ? c.ar : c.en;
  }

  money(n: number): string {
    const rtl = this.isRTL();
    const sym = rtl ? CURRENCY.symbolAr : CURRENCY.symbol;
    const num = n.toLocaleString(rtl ? 'ar-EG' : 'en-US');
    return rtl ? `${num} ${sym}` : `${sym} ${num}`;
  }
}
