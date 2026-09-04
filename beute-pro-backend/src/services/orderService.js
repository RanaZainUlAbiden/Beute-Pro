const pool = require('../config/db');
const PRODUCT_PRICES = require('../config/productPrices');

/**
 * Generate a unique order number: BP-XXXX (incremental)
 */
const generateOrderNumber = async () => {
  // Get the latest order number
  const result = await pool.query(
    `SELECT order_number FROM orders ORDER BY id DESC LIMIT 1`
  );
  let lastNumber = 0;
  if (result.rows.length > 0) {
    const parts = result.rows[0].order_number.split('-');
    if (parts.length === 2) {
      lastNumber = parseInt(parts[1], 10);
    }
  }
  const next = lastNumber + 1;
  return `BP-${String(next).padStart(4, '0')}`;
};

/**
 * Create a new order
 * @param {Object} data - { userId, customerEmail, customerPhone, customerName, shippingAddress, items, paymentMethod }
 * items: [{ productId, quantity }]
 */
const createOrder = async (data) => {
  const {
    userId = null,
    customerEmail,
    customerPhone,
    customerName,
    shippingAddress,
    items,
    paymentMethod,
  } = data;

  // 1. Validate items and calculate total
  let totalAmount = 0;
  const orderItems = [];
  for (const item of items) {
    const price = PRODUCT_PRICES[item.productId];
    if (price === undefined) {
      throw new Error(`Invalid product ID: ${item.productId}`);
    }
    if (item.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    const subtotal = price * item.quantity;
    totalAmount += subtotal;
    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: price,
    });
  }

  // 2. Generate order number
  const orderNumber = await generateOrderNumber();

  // 3. Insert order
  const orderResult = await pool.query(
    `INSERT INTO orders (
      order_number, user_id,
      customer_email, customer_phone, customer_name, shipping_address,
      total_amount_pkr, payment_method, status, payment_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, order_number, created_at`,
    [
      orderNumber,
      userId,
      customerEmail,
      customerPhone,
      customerName,
      shippingAddress,
      totalAmount,
      paymentMethod,
      'pending',     // default status
      paymentMethod === 'cod' ? 'unpaid' : 'pending', // for card we update later
    ]
  );

  const order = orderResult.rows[0];

  // 4. Insert order items
  for (const item of orderItems) {
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price_pkr)
       VALUES ($1, $2, $3, $4)`,
      [order.id, item.productId, item.quantity, item.unitPrice]
    );
  }

  // 5. Return the created order (with items)
  return getOrderById(order.id);
};

/**
 * Get order by ID (with items)
 */
const getOrderById = async (orderId) => {
  const orderResult = await pool.query(
    `SELECT * FROM orders WHERE id = $1`,
    [orderId]
  );
  if (orderResult.rows.length === 0) return null;
  const order = orderResult.rows[0];

  const itemsResult = await pool.query(
    `SELECT * FROM order_items WHERE order_id = $1`,
    [orderId]
  );
  order.items = itemsResult.rows;
  return order;
};

/**
 * Get order by order number (public tracking)
 */
const getOrderByNumber = async (orderNumber) => {
  const orderResult = await pool.query(
    `SELECT * FROM orders WHERE order_number = $1`,
    [orderNumber]
  );
  if (orderResult.rows.length === 0) return null;
  const order = orderResult.rows[0];

  const itemsResult = await pool.query(
    `SELECT * FROM order_items WHERE order_id = $1`,
    [order.id]
  );
  order.items = itemsResult.rows;
  return order;
};

/**
 * Get orders for a specific user
 */
const getOrdersByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  const orders = result.rows;
  for (const order of orders) {
    const itemsResult = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id]
    );
    order.items = itemsResult.rows;
  }
  return orders;
};

/**
 * Admin: Get all orders with pagination and filters
 */
const getAdminOrders = async (filters = {}) => {
  const { status, startDate, endDate, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let whereClauses = [];
  let params = [];
  let paramIndex = 1;

  if (status) {
    whereClauses.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }
  if (startDate) {
    whereClauses.push(`created_at >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }
  if (endDate) {
    whereClauses.push(`created_at <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    SELECT * FROM orders
    ${where}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) FROM orders ${where}
  `;
  const countResult = await pool.query(countQuery, params.slice(0, paramIndex - 1));
  const total = parseInt(countResult.rows[0].count, 10);

  // Fetch items for each order
  const orders = result.rows;
  for (const order of orders) {
    const itemsResult = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id]
    );
    order.items = itemsResult.rows;
  }

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Admin: Update order status
 */
const updateOrderStatus = async (orderId, status, adminNotes = null) => {
  const result = await pool.query(
    `UPDATE orders
     SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, adminNotes, orderId]
  );
  return result.rows[0] || null;
};

/**
 * Admin: Update tracking info
 */
const updateTracking = async (orderId, trackingNumber, courierName) => {
  const result = await pool.query(
    `UPDATE orders
     SET tracking_number = $1, courier_name = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [trackingNumber, courierName, orderId]
  );
  return result.rows[0] || null;
};

/**
 * Admin: Revenue summary
 */
const getRevenueSummary = async () => {
  // Total revenue (paid orders only? we can include all with status delivered, or all paid)
  // For now we'll sum total_amount_pkr for all orders (not cancelled)
  const totalQuery = await pool.query(
    `SELECT COALESCE(SUM(total_amount_pkr), 0) AS total
     FROM orders
     WHERE status != 'cancelled'`
  );
  const totalRevenue = parseFloat(totalQuery.rows[0].total);

  // Today's revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayQuery = await pool.query(
    `SELECT COALESCE(SUM(total_amount_pkr), 0) AS total
     FROM orders
     WHERE status != 'cancelled' AND created_at >= $1`,
    [today]
  );
  const todayRevenue = parseFloat(todayQuery.rows[0].total);

  // This month's revenue
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthQuery = await pool.query(
    `SELECT COALESCE(SUM(total_amount_pkr), 0) AS total
     FROM orders
     WHERE status != 'cancelled' AND created_at >= $1`,
    [monthStart]
  );
  const monthRevenue = parseFloat(monthQuery.rows[0].total);

  // Revenue by product (top 5)
  const productQuery = await pool.query(`
    SELECT oi.product_id, SUM(oi.quantity * oi.unit_price_pkr) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled'
    GROUP BY oi.product_id
    ORDER BY revenue DESC
    LIMIT 5
  `);

  return {
    totalRevenue,
    todayRevenue,
    monthRevenue,
    topProducts: productQuery.rows,
  };
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderByNumber,
  getOrdersByUserId,
  getAdminOrders,
  updateOrderStatus,
  updateTracking,
  getRevenueSummary,
};