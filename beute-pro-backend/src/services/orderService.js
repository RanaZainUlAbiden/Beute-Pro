const pool = require('../config/db');
const productService = require('./productService');
const inventoryService = require('./inventoryService');
const couponService = require('./couponService');
const notificationService = require('./notificationService');

/**
 * Generate a unique order number: BP-XXXX (incremental)
 */
const generateOrderNumber = async (client) => {
  const result = await client.query(
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
 * Create a new order.
 *
 * Transaction flow:
 *   1. Load prices from products table
 *   2. Validate items, calculate subtotal
 *   3. Apply coupon (if provided), calculate discount
 *   4. Insert order (with coupon fields)
 *   5. Insert order items
 *   6. Decrement inventory
 *   7. Increment coupon usage
 *   8. Commit
 *   9. Fire confirmation email (fire-and-forget)
 *
 * Any failure → ROLLBACK, no partial state.
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
    couponCode = null,
  } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Load prices
    const pricesMap = await productService.getPricesMap();

    // 2. Validate items, subtotal
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const price = pricesMap[item.productId];
      if (price === undefined) {
        throw Object.assign(new Error(`Invalid product ID: ${item.productId}`), { status: 400 });
      }
      if (item.quantity <= 0) {
        throw Object.assign(new Error('Quantity must be positive'), { status: 400 });
      }
      subtotal += price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: price,
      });
    }

    // 3. Coupon
    let discount = 0;
    let appliedCouponCode = null;
    if (couponCode) {
      const result = await couponService.validate(couponCode, subtotal);
      if (!result.valid) {
        throw Object.assign(new Error(result.reason), { status: 400 });
      }
      discount = result.discount;
      appliedCouponCode = result.coupon.code;
    }

    const totalAmount = +(subtotal - discount).toFixed(2);

    // 4. Insert order
    const orderNumber = await generateOrderNumber(client);
    const orderResult = await client.query(
      `INSERT INTO orders (
        order_number, user_id,
        customer_email, customer_phone, customer_name, shipping_address,
        total_amount_pkr, payment_method, status, payment_status,
        coupon_code, discount_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        'pending',
        paymentMethod === 'cod' ? 'unpaid' : 'pending',
        appliedCouponCode,
        discount,
      ]
    );

    const order = orderResult.rows[0];

    // 5. Insert order items
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_pkr)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.productId, item.quantity, item.unitPrice]
      );
    }

    // 6. Decrement inventory (blocks overselling)
    await inventoryService.decrementForOrder(client, orderItems);

    // 7. Increment coupon usage
    if (appliedCouponCode) {
      await couponService.incrementUsage(client, appliedCouponCode);
    }

    await client.query('COMMIT');

    // 8. Fetch the full order (outside transaction — read-only)
    const fullOrder = await getOrderById(order.id);

    // 9. Fire-and-forget confirmation email
    void notificationService.sendOrderConfirmation(fullOrder);

    return fullOrder;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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

  const countQuery = `SELECT COUNT(*) FROM orders ${where}`;
  const countResult = await pool.query(countQuery, params.slice(0, paramIndex - 1));
  const total = parseInt(countResult.rows[0].count, 10);

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
 * Fires a status-specific email if the status is shipped/delivered/cancelled.
 */
const updateOrderStatus = async (orderId, status, adminNotes = null) => {
  const result = await pool.query(
    `UPDATE orders
     SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, adminNotes, orderId]
  );
  const order = result.rows[0];
  if (!order) return null;

  // Fire-and-forget: shipping / delivery / cancellation email
  void notificationService.notifyOrderStatusChange(order, status);

  return order;
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
  const totalQuery = await pool.query(
    `SELECT COALESCE(SUM(total_amount_pkr), 0) AS total
     FROM orders WHERE status != 'cancelled'`
  );
  const totalRevenue = parseFloat(totalQuery.rows[0].total);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayQuery = await pool.query(
    `SELECT COALESCE(SUM(total_amount_pkr), 0) AS total
     FROM orders WHERE status != 'cancelled' AND created_at >= $1`,
    [today]
  );
  const todayRevenue = parseFloat(todayQuery.rows[0].total);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthQuery = await pool.query(
    `SELECT COALESCE(SUM(total_amount_pkr), 0) AS total
     FROM orders WHERE status != 'cancelled' AND created_at >= $1`,
    [monthStart]
  );
  const monthRevenue = parseFloat(monthQuery.rows[0].total);

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

/**
 * Admin: Bulk update order status.
 * Fires status emails per order (fire-and-forget).
 */
const bulkUpdateStatus = async (orderIds, status, adminNotes = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE orders
       SET status = $1,
           admin_notes = COALESCE($2, admin_notes),
           updated_at = NOW()
       WHERE id = ANY($3)
       RETURNING id, order_number, customer_email, customer_name,
                 shipping_address, status, tracking_number, courier_name`,
      [status, adminNotes, orderIds]
    );

    await client.query('COMMIT');

    // Fire status emails per order (fire-and-forget)
    for (const row of result.rows) {
      void notificationService.notifyOrderStatusChange(row, status);
    }

    return {
      updated: result.rowCount,
      orders: result.rows,
      requested: orderIds.length,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Admin: Bulk update tracking info.
 */
const bulkUpdateTracking = async (orderIds, trackingNumber, courierName) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE orders
       SET tracking_number = $1,
           courier_name = $2,
           updated_at = NOW()
       WHERE id = ANY($3)
       RETURNING id, order_number, tracking_number, courier_name, updated_at`,
      [trackingNumber, courierName, orderIds]
    );

    await client.query('COMMIT');

    return {
      updated: result.rowCount,
      orders: result.rows,
      requested: orderIds.length,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
  bulkUpdateStatus,
  bulkUpdateTracking,
};