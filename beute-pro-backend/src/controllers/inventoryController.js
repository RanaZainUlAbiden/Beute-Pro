const inventoryService = require('../services/inventoryService');

/** Public: get stock for a single product (used on PDP). */
const getOne = async (req, res) => {
  try {
    const inv = await inventoryService.getByProductId(req.params.productId);
    res.json({ inventory: inv });
  } catch (err) {
    console.error('Get inventory error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: list all inventory. */
const adminList = async (req, res) => {
  try {
    const { search, lowStockOnly } = req.query;
    const items = await inventoryService.listAll({
      search,
      lowStockOnly: lowStockOnly === 'true',
    });
    res.json({ items });
  } catch (err) {
    console.error('Admin list inventory error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: set absolute stock for a product. */
const adminSet = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, lowStockThreshold } = req.body;
    if (typeof quantity !== 'number') {
      return res.status(400).json({ error: 'quantity must be a number' });
    }
    const inv = await inventoryService.setQuantity(
      productId,
      quantity,
      lowStockThreshold
    );
    res.json({ success: true, inventory: inv });
  } catch (err) {
    console.error('Admin set inventory error:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};

/** Admin: list low-stock only (dashboard widget). */
const adminLowStock = async (req, res) => {
  try {
    const items = await inventoryService.listLowStock();
    res.json({ items });
  } catch (err) {
    console.error('Low stock error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getOne, adminList, adminSet, adminLowStock };