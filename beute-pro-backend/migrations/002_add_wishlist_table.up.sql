-- ============================================================
-- 002_add_wishlist_table.up.sql
-- Wishlist table: users can save products
-- ============================================================

CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Index for fast lookups by user
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);