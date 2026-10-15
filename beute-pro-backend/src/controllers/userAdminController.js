const userAdminService = require('../services/userAdminService');

/** Admin: list all users. */
const listUsers = async (req, res) => {
  try {
    const { search, role, sortBy, sortDir, page, limit } = req.query;
    const result = await userAdminService.listAll({
      search: search ? String(search).trim() : undefined,
      role,
      sortBy,
      sortDir,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list users error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: get a single user (any role). */
const getUser = async (req, res) => {
  try {
    const user = await userAdminService.getById(parseInt(req.params.id, 10));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Admin get user error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: promote or demote a user. */
const setUserRole = async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { is_admin } = req.body;

    if (typeof is_admin !== 'boolean') {
      return res.status(400).json({ error: 'is_admin must be a boolean' });
    }

    const user = await userAdminService.setRole(
      targetId,
      is_admin,
      req.user.id
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Admin set role error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
};

module.exports = { listUsers, getUser, setUserRole };