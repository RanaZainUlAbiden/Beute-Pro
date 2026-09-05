const customerService = require('../services/customerService');
const { adminCustomerUpdateSchema } = require('../utils/validators');

/**
 * Admin: list customers (search, sort, pagination)
 * GET /api/admin/customers
 */
const adminListCustomers = async (req, res) => {
  try {
    const { search, sortBy, sortDir, page, limit } = req.query;
    const result = await customerService.getAllCustomers({
      search: search ? String(search).trim() : undefined,
      sortBy,
      sortDir,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list customers error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Admin: get a single customer
 * GET /api/admin/customers/:id
 */
const adminGetCustomer = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(parseInt(req.params.id, 10));
    if (!customer || customer.is_admin) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ customer });
  } catch (err) {
    console.error('Admin get customer error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Admin: update a customer's details
 * PUT /api/admin/customers/:id
 */
const adminUpdateCustomer = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { error, value } = adminCustomerUpdateSchema.validate(req.body, { abortEarly: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existing = await customerService.getCustomerById(id);
    if (!existing || existing.is_admin) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const emailTaken = await customerService.findByEmail(value.email, id);
    if (emailTaken) {
      return res.status(409).json({ error: 'That email is already in use by another account' });
    }

    const customer = await customerService.updateCustomer(id, value);
    res.json({ success: true, customer });
  } catch (err) {
    console.error('Admin update customer error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Admin: delete a customer
 * DELETE /api/admin/customers/:id
 *
 * Safe by schema: orders.user_id is ON DELETE SET NULL and every order keeps
 * its own snapshot of the customer's name/email/phone/address, so deleting
 * the account cannot orphan or corrupt existing orders.
 */
const adminDeleteCustomer = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: "You can't delete your own account" });
    }

    const existing = await customerService.getCustomerById(id);
    if (!existing || existing.is_admin) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customerService.deleteCustomer(id);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    console.error('Admin delete customer error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  adminListCustomers,
  adminGetCustomer,
  adminUpdateCustomer,
  adminDeleteCustomer,
};
