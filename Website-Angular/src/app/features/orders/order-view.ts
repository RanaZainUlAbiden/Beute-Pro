import type { TranslationKey } from '../../core/data/i18n.data';
import { PRODUCTS } from '../../core/data/products';
import type { Lang } from '../../core/models/i18n';
import type { OrderItem } from '../../services/order';

/* =============================================================
   ORDER VIEW HELPERS

   The four pages that render an order — track, my orders, order
   detail, and the admin order screen — all need the same three
   answers, so they are here rather than copied into each:

     - the five statuses, and the four that form a sequence
       (cancelled is not a step on the way to anywhere)
     - the translation keys for a status label and its note
     - a product name for an order line

   The last one matters: an order line stores a product id and,
   on newer rows, a name snapshot. Neither is a name in the
   visitor's language, so the catalogue is consulted first and
   the snapshot is the fallback for a product that has since
   left the range.
   ============================================================= */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/** The statuses that form a sequence, in order. `cancelled` is not one. */
export const ORDER_FLOW = ['pending', 'processing', 'shipped', 'delivered'] as const;

export const ALL_STATUSES: readonly OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

/** How far along ORDER_FLOW a status sits; -1 for cancelled or unknown. */
export function statusIndex(status: string | undefined | null): number {
  return ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
}

export function statusKey(status: string): TranslationKey {
  return `status.${status}` as TranslationKey;
}

export function statusNoteKey(status: string): TranslationKey {
  return `status.${status}.note` as TranslationKey;
}

/** `pill pill--shipped` — the badge classes for a status. */
export function statusPill(status: string): string {
  return `pill pill--${status}`;
}

/** Title Case from a product id, for a line no longer in the catalogue. */
function fromId(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function itemName(item: Pick<OrderItem, 'product_id' | 'product_name_snapshot'>, lang: Lang): string {
  const product = PRODUCTS.find((p) => p.id === item.product_id);
  if (product) return (lang === 'ar' ? product.ar : product.en).name;
  return item.product_name_snapshot || fromId(item.product_id);
}
