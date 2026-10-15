const exportService = require('../services/exportService');
const { sendCsv } = require('../utils/csv');

const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

/** Admin: download orders as CSV. */
const ordersCsv = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const csv = await exportService.exportOrders({ status, startDate, endDate });
    sendCsv(res, `orders_${timestamp()}.csv`, csv);
  } catch (err) {
    console.error('Export orders error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: download products as CSV. */
const productsCsv = async (req, res) => {
  try {
    const csv = await exportService.exportProducts();
    sendCsv(res, `products_${timestamp()}.csv`, csv);
  } catch (err) {
    console.error('Export products error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: download customers as CSV. */
const customersCsv = async (req, res) => {
  try {
    const csv = await exportService.exportCustomers();
    sendCsv(res, `customers_${timestamp()}.csv`, csv);
  } catch (err) {
    console.error('Export customers error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { ordersCsv, productsCsv, customersCsv };