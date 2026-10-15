DROP INDEX IF EXISTS idx_products_ar_data_gin;
DROP INDEX IF EXISTS idx_products_en_data_gin;
DROP INDEX IF EXISTS idx_products_badge;
DROP INDEX IF EXISTS idx_products_display_order;
DROP INDEX IF EXISTS idx_products_active;
DROP INDEX IF EXISTS idx_products_category;

DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;