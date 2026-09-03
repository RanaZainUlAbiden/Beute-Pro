export type Lang = 'en' | 'ar';

export const LANGS: readonly Lang[] = ['en', 'ar'];

export function isLang(v: string | null): v is Lang {
  return v === 'en' || v === 'ar';
}
