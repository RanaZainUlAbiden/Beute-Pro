/* Shapes for everything in core/data/products.ts. */

export interface Currency {
  /** ISO-ish code, informational only. */
  code: string;
  /** Shown before the number in LTR. */
  symbol: string;
  /** Shown after the number in RTL. */
  symbolAr: string;
}

export interface Category {
  /** Lowercase-with-dashes. Drives `/shop/:category` and the tile image. */
  id: string;
  en: string;
  ar: string;
}

export type Badge = 'bestseller' | 'new' | 'sale';

/** The half of a product that changes with the active language. */
export interface ProductCopy {
  name: string;
  tagline: string;
  description: string;
  ingredients: string[];
  benefits: string[];
  usage: string;
}

export interface Product {
  /** Unique, lowercase-with-dashes — also drives every image path. */
  id: string;
  /** Must match a CATEGORIES id. */
  category: string;
  price: number;
  /** A number shows a strike-through sale price; null shows one price. */
  oldPrice: number | null;
  badge: Badge | null;
  /** How many product photos exist. */
  images: number;
  /** True where a 360° video exists at assets/video/spin/<id>.mp4. */
  spin: boolean;
  /** Display string, e.g. "120 ml (4.06 OZ)". */
  size: string;
  en: ProductCopy;
  ar: ProductCopy;
}
