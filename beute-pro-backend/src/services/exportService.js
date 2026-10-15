const pool = require('../config/db');
const { toCsv } = require('../utils/csv');

// ============================================================
// ORDERS
// ============================================================
const exportOrders = async (filters = {}) => {
  const { status, startDate, endDate } = filters;

  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    where.push(`created_at >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    where.push(`created_at <= $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT
       id, order_number, customer_name, customer_email, customer_phone,
       shipping_address, total_amount_pkr, discount_amount, coupon_code,
       status, payment_method, payment_status,
       tracking_number, courier_name, created_at
     FROM orders
     ${whereSql}
     ORDER BY created_at DESC`,
    params
  );

  const columns = [
    { key: 'order_number',      header: 'Order #' },
    { key: 'customer_name',     header: 'Customer' },
    { key: 'customer_email',    header: 'Email' },
    { key: 'customer_phone',    header: 'Phone' },
    { key: 'shipping_address',  header: 'Address' },
    { key: 'total_amount_pkr',  header: 'Total (PKR)' },
    { key: 'discount_amount',   header: 'Discount (PKR)' },
    { key: 'coupon_code',       header: 'Coupon' },
    { key: 'status',            header: 'Status' },
    { key: 'payment_method',    header: 'Payment Method' },
    { key: 'payment_status',    header: 'Payment Status' },
    { key: 'tracking_number',   header: 'Tracking #' },
    { key: 'courier_name',      header: 'Courier' },
    {
      key: 'created_at',
      header: 'Date',
      format: (r) => new Date(r.created_at).toISOString(),
    },
  ];

  return toCsv(result.rows, columns);
};

// ============================================================
// PRODUCTS
// ============================================================
const exportProducts = async () => {
  const result = await pool.query(
    `SELECT
       p.id, p.category_id, c.en_name AS category_en, c.ar_name AS category_ar,
       p.price, p.old_price, p.badge, p.size, p.images_count, p.spin,
       p.en_data->>'name' AS name_en,
       p.ar_data->>'name' AS name_ar,
       p.is_active, p.display_order, p.created_at
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ORDER BY p.display_order ASC, p.id ASC`
  );

  const columns = [
    { key: 'id',              header: 'Product ID' },
    { key: 'name_en',         header: 'Name (EN)' },
    { key: 'name_ar',         header: 'Name (AR)' },
    { key: 'category_id',     header: 'Category ID' },
    { key: 'category_en',     header: 'Category (EN)' },
    { key: 'category_ar',     header: 'Category (AR)' },
    { key: 'price',           header: 'Price (PKR)' },
    { key: 'old_price',       header: 'Old Price (PKR)' },
    { key: 'badge',           header: 'Badge' },
    { key: 'size',            header: 'Size' },
    { key: 'images_count',    header: 'Images' },
    { key: 'spin',            header: '360° Video' },
    { key: 'is_active',       header: 'Active' },
    { key: 'display_order',   header: 'Display Order' },
    {
      key: 'created_at',
      header: 'Created',
      format: (r) => new Date(r.created_at).toISOString(),
    },
  ];

  return toCsv(result.rows, columns);
};

// ============================================================
// CUSTOMERS
// ============================================================
const exportCustomers = async () => {
  const result = await pool.query(
    `SELECT
       u.id, u.full_name, u.email, u.phone, u.address, u.is_admin, u.created_at,
       COUNT(o.id)::int AS order_count,
       COALESCE(SUM(o.total_amount_pkr), 0) AS lifetime_value
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );

  const columns = [
    { key: 'id',              header: 'ID' },
    { key: 'full_name',       header: 'Name' },
    { key: 'email',           header: 'Email' },
    { key: 'phone',           header: 'Phone' },
    { key: 'address',         header: 'Address' },
    { key: 'is_admin',        header: 'Admin' },
    { key: 'order_count',     header: 'Orders' },
    { key: 'lifetime_value',  header: 'Lifetime Value (PKR)' },
    {
      key: 'created_at',
      header: 'Joined',
      format: (r) => new Date(r.created_at).toISOString(),
    },
  ];

  return toCsv(result.rows, columns);
};

module.exports = { exportOrders, exportProducts, exportCustomers };