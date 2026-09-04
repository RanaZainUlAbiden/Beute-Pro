const pool = require('../config/db');

/**
 * Get comprehensive dashboard statistics for admin
 * GET /api/admin/dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    // 1. Order counts by status
    const statusCountResult = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM orders
      GROUP BY status
    `);
    const ordersByStatus = statusCountResult.rows;

    // 2. Total orders
    const totalOrdersResult = await pool.query(`
      SELECT COUNT(*) AS total FROM orders
    `);
    const totalOrders = parseInt(totalOrdersResult.rows[0].total, 10);

    // 3. Total revenue (valid, non-cancelled orders)
    const revenueResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount_pkr), 0) AS total
      FROM orders
      WHERE status != 'cancelled'
    `);
    const totalRevenue = parseFloat(revenueResult.rows[0].total);

    // 4. Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenueResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount_pkr), 0) AS total
      FROM orders
      WHERE status != 'cancelled' AND created_at >= $1
    `, [today]);
    const todayRevenue = parseFloat(todayRevenueResult.rows[0].total);

    // 5. New customers (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newCustomersResult = await pool.query(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE created_at >= $1
    `, [weekAgo]);
    const newCustomers = parseInt(newCustomersResult.rows[0].count, 10);

    // 6. Total customers
    const totalCustomersResult = await pool.query(`
      SELECT COUNT(*) AS total FROM users
    `);
    const totalCustomers = parseInt(totalCustomersResult.rows[0].total, 10);

    // 7. Daily revenue for last 7 days (for chart)
    const dailyRevenueResult = await pool.query(`
      SELECT DATE(created_at) AS date,
             COALESCE(SUM(total_amount_pkr), 0) AS revenue
      FROM orders
      WHERE status != 'cancelled'
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    const dailyRevenue = dailyRevenueResult.rows.map(row => ({
      date: row.date,
      revenue: parseFloat(row.revenue),
    }));

    // 8. Top 5 products by revenue
    const topProductsResult = await pool.query(`
      SELECT oi.product_id,
             SUM(oi.quantity) AS total_quantity,
             SUM(oi.quantity * oi.unit_price_pkr) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled'
      GROUP BY oi.product_id
      ORDER BY revenue DESC
      LIMIT 5
    `);
    const topProducts = topProductsResult.rows.map(row => ({
      productId: row.product_id,
      totalQuantity: parseInt(row.total_quantity, 10),
      revenue: parseFloat(row.revenue),
    }));

    // 9. Recent orders (last 5)
    const recentOrdersResult = await pool.query(`
      SELECT id, order_number, customer_name, total_amount_pkr, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);
    const recentOrders = recentOrdersResult.rows.map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      total: parseFloat(row.total_amount_pkr),
      status: row.status,
      createdAt: row.created_at,
    }));

    // Response
    res.json({
      summary: {
        totalOrders,
        totalRevenue,
        todayRevenue,
        totalCustomers,
        newCustomers,
      },
      ordersByStatus,
      dailyRevenue,
      topProducts,
      recentOrders,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

module.exports = {
  getDashboardStats,
};