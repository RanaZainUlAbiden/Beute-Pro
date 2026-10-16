CREATE TABLE IF NOT EXISTS product_media (
  id            SERIAL PRIMARY KEY,
  product_id    VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind          VARCHAR(20) NOT NULL CHECK (kind IN ('image', 'spin_video')),
  url           TEXT NOT NULL,
  storage_key   TEXT NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  file_size     INTEGER NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_kind ON product_media(kind);
