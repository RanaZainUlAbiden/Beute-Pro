const settingsService = require('../services/settingsService');

/** Public: get all settings (frontend needs free-shipping threshold etc.). */
const getPublic = async (req, res) => {
  try {
    const settings = await settingsService.getAll();
    // Expose only safe, public-facing keys
    const publicKeys = [
      'free_shipping_min_pkr',
      'cod_extra_charges_pkr',
      'store_phone',
    ];
    const out = {};
    for (const k of publicKeys) if (k in settings) out[k] = settings[k];
    res.json({ settings: out });
  } catch (err) {
    console.error('Get public settings error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: get all settings (raw). */
const adminGetAll = async (req, res) => {
  try {
    const settings = await settingsService.getAll();
    res.json({ settings });
  } catch (err) {
    console.error('Admin get settings error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: bulk update. */
const adminSetMany = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Body must be a key-value object' });
    }
    const settings = await settingsService.setMany(req.body);
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Admin set settings error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPublic, adminGetAll, adminSetMany };