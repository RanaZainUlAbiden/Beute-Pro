/**
 * API response shapes.
 * These mirror the JSON payloads from the backend (see backend/src/services/*).
 * Do NOT confuse with core/models/product.ts — that one is the
 * frontend-only model used by the existing hardcoded products.ts.
 */

// ============================================================
// PRODUCTS
// ============================================================
export interface ApiProductCopy {
  name: string;
  tagline: string;
  description: string;
  ingredients: string[];
  benefits: string[];
  usage: string;
}

export interface ApiProduct {
  id: string;
  category: string;
  price: number;
  oldPrice: number | null;
  badge: 'bestseller' | 'new' | 'sale' | null;
  images: number;
  spin: boolean;
  size: string;
  en: ApiProductCopy;
  ar: ApiProductCopy;
  isActive: boolean;
  displayOrder: number;
  mediaBaseUrl: string;
  videoBaseUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: ApiProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  category?: string;
  badge?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductCreatePayload {
  id: string;
  category: string;
  price: number;
  oldPrice?: number | null;
  badge?: 'bestseller' | 'new' | 'sale' | null;
  size?: string;
  images?: number;
  spin?: boolean;
  en: ApiProductCopy;
  ar: ApiProductCopy;
  isActive?: boolean;
  displayOrder?: number;
  mediaBaseUrl?: string;
  videoBaseUrl?: string;
}

export type ProductUpdatePayload = Partial<Omit<ProductCreatePayload, 'id'>>;

// ============================================================
// CATEGORIES
// ============================================================
export interface ApiCategory {
  id: string;
  en: string;
  ar: string;
  imageUrl: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  categories: ApiCategory[];
}

export interface CategoryCreatePayload {
  id: string;
  en: string;
  ar: string;
  imageUrl?: string | null;
  displayOrder?: number;
}

export type CategoryUpdatePayload = Partial<Omit<CategoryCreatePayload, 'id'>>;

// ============================================================
// INVENTORY
// ============================================================
export interface ApiInventory {
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: string | null;
}

export interface ApiInventoryRow {
  productId: string;
  productNameEn: string;
  productNameAr: string;
  quantity: number;
  lowStockThreshold: number;
  isLow: boolean;
  updatedAt: string | null;
}

export interface InventoryListResponse {
  items: ApiInventoryRow[];
}

// ============================================================
// COUPONS
// ============================================================
export type DiscountType = 'percentage' | 'fixed';

export interface ApiCoupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CouponListResponse {
  coupons: ApiCoupon[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CouponValidateResponse {
  valid: boolean;
  discount: number;
  reason: string | null;
}

export interface CouponCreatePayload {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

export type CouponUpdatePayload = Partial<Omit<CouponCreatePayload, 'code'>>;

// ============================================================
// SETTINGS
// ============================================================
export type StoreSettings = Record<string, string>;

export interface SettingsResponse {
  settings: StoreSettings;
}