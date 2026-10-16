const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');

// ============================================
// CONTROLLERS
// ============================================

// Orders
const {
  adminListOrders,
  adminGetOrder,
  adminUpdateStatus,
  adminAddTracking,
  getRevenue,
  adminBulkUpdateStatus,
  adminBulkUpdateTracking,
} = require('../controllers/orderController');

// Dashboard & currency
const { getDashboardStats } = require('../controllers/dashboardController');
const { refreshRates,setRate } = require('../controllers/currencyController');

// Contact
const {
  getMessages,
  updateMessageStatus,
  deleteMessage,
} = require('../controllers/contactController');

// Customers
const {
  adminListCustomers,
  adminGetCustomer,
  adminUpdateCustomer,
  adminDeleteCustomer,
} = require('../controllers/customerController');

// Products & categories (Phase 5A)
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const mediaController = require('../controllers/productMediaController');
const upload = require('../middleware/upload');

// Inventory, coupons, settings (Phase 5B)
const inventoryController = require('../controllers/inventoryController');
const couponController = require('../controllers/couponController');
const settingsController = require('../controllers/settingsController');

// Users & exports (Phase 5C)
const userAdminController = require('../controllers/userAdminController');
const exportController = require('../controllers/exportController');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(adminOnly);

// ============================================
// ORDER MANAGEMENT
// ============================================
router.get('/orders', adminListOrders);
router.get('/orders/:id', adminGetOrder);
router.put('/orders/:id/status', adminUpdateStatus);
router.put('/orders/:id/tracking', adminAddTracking);

// Bulk order actions
router.put('/orders/bulk/status', adminBulkUpdateStatus);
router.put('/orders/bulk/tracking', adminBulkUpdateTracking);

// ============================================
// REVENUE & ANALYTICS
// ============================================
router.get('/revenue', getRevenue);
router.get('/dashboard', getDashboardStats);

// ============================================
// CURRENCY MANAGEMENT
// ============================================
router.post('/rates/refresh', refreshRates);
router.put('/rates/:currency', setRate);

// ============================================
// CONTACT MANAGEMENT
// ============================================
router.get('/contact', getMessages);
router.put('/contact/:id/status', updateMessageStatus);
router.delete('/contact/:id', deleteMessage);

// ============================================
// CUSTOMER MANAGEMENT
// ============================================
router.get('/customers', adminListCustomers);
router.get('/customers/:id', adminGetCustomer);
router.put('/customers/:id', adminUpdateCustomer);
router.delete('/customers/:id', adminDeleteCustomer);

// ============================================
// PRODUCT MANAGEMENT (Phase 5A)
// ============================================
// Keep media routes before every /products/:id route to prevent shadowing.
router.get('/products/:id/media', mediaController.listMedia, mediaController.handleError);
router.post('/products/:id/media/images', upload.array('files', 10), mediaController.uploadImages, mediaController.handleError);
router.post('/products/:id/media/video', upload.single('file'), mediaController.uploadVideo, mediaController.handleError);
router.delete('/products/:id/media/:mediaId', mediaController.deleteMedia, mediaController.handleError);
router.get('/products', productController.adminList);
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.remove);

// ============================================
// CATEGORY MANAGEMENT (Phase 5A)
// ============================================
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.remove);

// ============================================
// INVENTORY MANAGEMENT (Phase 5B)
// ============================================
router.get('/inventory', inventoryController.adminList);
router.get('/inventory/low-stock', inventoryController.adminLowStock);
router.put('/inventory/:productId', inventoryController.adminSet);

// ============================================
// COUPON MANAGEMENT (Phase 5B)
// ============================================
router.get('/coupons', couponController.adminList);
router.post('/coupons', couponController.adminCreate);
router.put('/coupons/:code', couponController.adminUpdate);
router.delete('/coupons/:code', couponController.adminRemove);

// ============================================
// STORE SETTINGS (Phase 5B)
// ============================================
router.get('/settings', settingsController.adminGetAll);
router.put('/settings', settingsController.adminSetMany);

// ============================================
// USER ROLE MANAGEMENT (Phase 5C)
// ============================================
router.get('/users', userAdminController.listUsers);
router.get('/users/:id', userAdminController.getUser);
router.put('/users/:id/role', userAdminController.setUserRole);

// ============================================
// CSV EXPORTS (Phase 5C)
// ============================================
router.get('/export/orders.csv', exportController.ordersCsv);
router.get('/export/products.csv', exportController.productsCsv);
router.get('/export/customers.csv', exportController.customersCsv);

module.exports = router;
