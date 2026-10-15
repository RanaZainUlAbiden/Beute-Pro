-- ============================================================
-- 004_add_products_categories.up.sql
-- Béute Pro — Products & Categories
-- ============================================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id              VARCHAR(50) PRIMARY KEY,
  en_name         VARCHAR(255) NOT NULL,
  ar_name         VARCHAR(255) NOT NULL,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Products
-- Note: id is VARCHAR(100) to match order_items.product_id
CREATE TABLE IF NOT EXISTS products (
  id                VARCHAR(100) PRIMARY KEY,
  category_id       VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,

  -- Pricing
  price             DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  old_price         DECIMAL(12,2) NULL CHECK (old_price IS NULL OR old_price >= price),

  -- Meta
  badge             VARCHAR(20) NULL CHECK (badge IS NULL OR badge IN ('bestseller','new','sale')),
  size              VARCHAR(100),
  images_count      INTEGER DEFAULT 1 CHECK (images_count BETWEEN 1 AND 10),
  spin              BOOLEAN DEFAULT FALSE,

  -- Media (relative paths; change base_url later to point at CDN)
  media_base_url    VARCHAR(500) DEFAULT '/assets/img/products',
  video_base_url    VARCHAR(500) DEFAULT '/assets/video/spin',

  -- Bilingual content (JSONB)
  --   Shape: { name, tagline, description, ingredients: [], benefits: [], usage }
  en_data           JSONB NOT NULL,
  ar_data           JSONB NOT NULL,

  -- Display
  is_active         BOOLEAN DEFAULT TRUE,
  display_order     INTEGER DEFAULT 0,

  -- Audit
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_products_category      ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active        ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);
CREATE INDEX IF NOT EXISTS idx_products_badge         ON products(badge);

-- 4. GIN index on JSONB for future search inside name/tagline
CREATE INDEX IF NOT EXISTS idx_products_en_data_gin  ON products USING GIN (en_data);
CREATE INDEX IF NOT EXISTS idx_products_ar_data_gin  ON products USING GIN (ar_data);