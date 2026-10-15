-- ============================================================
-- 005_add_orders_coupon_columns.up.sql
-- Béute Pro — Coupon tracking on orders
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_code     VARCHAR(50)   NULL,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0
                                            CHECK (discount_amount >= 0);

CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);