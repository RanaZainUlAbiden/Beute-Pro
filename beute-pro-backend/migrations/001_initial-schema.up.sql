-- ============================================================
-- 001_initial-schema.up.sql
-- Béute Pro — Phase 0 Database Schema
-- ============================================================

-- 1. Users (registered customers + admins)
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE,
  phone           VARCHAR(20),
  full_name       VARCHAR(255),
  password_hash   VARCHAR(255),
  google_id       VARCHAR(255) UNIQUE,
  address         TEXT,
  is_admin        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Orders (includes guest checkout fields)
CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL PRIMARY KEY,
  order_number      VARCHAR(50) UNIQUE NOT NULL,
  user_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Guest checkout mandatory fields (even if user is logged in, we copy these)
  customer_email    VARCHAR(255) NOT NULL,
  customer_phone    VARCHAR(20) NOT NULL,
  customer_name     VARCHAR(255) NOT NULL,
  shipping_address  TEXT NOT NULL,

  -- Financials (base currency is PKR)
  total_amount_pkr  DECIMAL(12,2) NOT NULL,

  -- Statuses
  status            VARCHAR(30) DEFAULT 'pending',   -- pending, processing, shipped, delivered, cancelled
  payment_method    VARCHAR(30) NOT NULL,             -- cod, card, bank_transfer
  payment_status    VARCHAR(30) DEFAULT 'unpaid',     -- unpaid, paid, refunded

  -- Tracking
  tracking_number   VARCHAR(100),
  courier_name      VARCHAR(50),

  -- Internal notes
  admin_notes       TEXT,

  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Order Items (snapshot of product data at purchase time)
CREATE TABLE IF NOT EXISTS order_items (
  id                  SERIAL PRIMARY KEY,
  order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  product_id          VARCHAR(100) NOT NULL,   -- matches frontend hardcoded ID
  product_name_snapshot VARCHAR(255),          -- optional, for history
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_pkr      DECIMAL(12,2) NOT NULL,  -- snapshot of price

  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Exchange Rates (auto-updated by a scheduled job or on-demand)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id                SERIAL PRIMARY KEY,
  base_currency     VARCHAR(10) DEFAULT 'PKR',
  target_currency   VARCHAR(10) NOT NULL UNIQUE,
  rate              DECIMAL(12,6) NOT NULL,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Inventory (manual stock tracking, no CRUD in admin but essential for frontend)
CREATE TABLE IF NOT EXISTS inventory (
  product_id          VARCHAR(100) PRIMARY KEY,
  quantity            INTEGER DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Coupons / Discounts (marketing)
CREATE TABLE IF NOT EXISTS coupons (
  code              VARCHAR(50) PRIMARY KEY,
  discount_type     VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value    DECIMAL(10,2) NOT NULL,
  min_order_value   DECIMAL(10,2) DEFAULT 0,
  max_uses          INTEGER,
  used_count        INTEGER DEFAULT 0,
  expires_at        TIMESTAMP WITH TIME ZONE,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Store Settings (dynamic configs)
CREATE TABLE IF NOT EXISTS store_settings (
  key               VARCHAR(100) PRIMARY KEY,
  value             TEXT,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default settings
INSERT INTO store_settings (key, value) VALUES 
  ('free_shipping_min_pkr', '3000'),
  ('cod_extra_charges_pkr', '0'),
  ('store_phone', '+92-XXXXXXXXXX')
ON CONFLICT (key) DO NOTHING;

-- Seed initial exchange rates (fallback if API fails)
INSERT INTO exchange_rates (target_currency, rate) VALUES 
  ('USD', 0.0036),
  ('AED', 0.0132)
ON CONFLICT (target_currency) DO NOTHING;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);