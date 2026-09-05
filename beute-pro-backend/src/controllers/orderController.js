const orderService = require('../services/orderService'); // ✅ Fixed path

/**
 * Place a new order (guest or authenticated)
 * POST /api/orders
 */
const placeOrder = async (req, res) => {
  try {
    const {
      email,
      phone,
      name,
      address,
      items,
      paymentMethod,
    } = req.body;

    // Basic validation
    if (!email || !phone || !name || !address || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['cod', 'card', 'bank_transfer'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // If user is logged in, we associate the order with their ID
    const userId = req.user ? req.user.id : null;

    const order = await orderService.createOrder({
      userId,
      customerEmail: email,
      customerPhone: phone,
      customerName: name,
      shippingAddress: address,
      items,
      paymentMethod,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Place order error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

/**
 * Get logged-in user's orders
 * GET /api/orders/my
 */
const getMyOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const orders = await orderService.getOrdersByUserId(req.user.id);
    res.json({ orders });
  } catch (err) {
    console.error('Get my orders error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Public order tracking by order number
 * GET /api/orders/track/:orderNumber
 */
const trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  } catch (err) {
    console.error('Track order error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// ============= ADMIN CONTROLLERS =============

/**
 * Admin: List all orders with filters
 * GET /api/admin/orders
 */
const adminListOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const result = await orderService.getAdminOrders({
      status,
      startDate,
      endDate,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list orders error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Admin: Get single order by ID
 * GET /api/admin/orders/:id
 */
const adminGetOrder = async (req, res) => {
  try {
    const order = await orderService.getOrderById(parseInt(req.params.id, 10));
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  } catch (err) {
    console.error('Admin get order error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Admin: Update order status
 * PUT /api/admin/orders/:id/status
 */
const adminUpdateStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await orderService.updateOrderStatus(parseInt(req.params.id, 10), status, adminNotes);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  } catch (err) {
    console.error('Admin update status error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Admin: Add tracking info
 * PUT /api/admin/orders/:id/tracking
 */
const adminAddTracking = async (req, res) => {
  try {
    const { trackingNumber, courierName } = req.body;
    if (!trackingNumber || !courierName) {
      return res.status(400).json({ error: 'Tracking number and courier name required' });
    }
    const order = await orderService.updateTracking(parseInt(req.params.id, 10), trackingNumber, courierName);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  } catch (err) {
    console.error('Admin add tracking error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Admin: Revenue summary
 * GET /api/admin/revenue
 */
const getRevenue = async (req, res) => {
  try {
    const summary = await orderService.getRevenueSummary();
    res.json(summary);
  } catch (err) {
    console.error('Revenue error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  trackOrder,
  adminListOrders,
  adminGetOrder,
  adminUpdateStatus,
  adminAddTracking,
  getRevenue,
};