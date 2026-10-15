const pool = require('../config/db');
const {
  getExchangeRates,
  updateExchangeRates,
} = require('../services/exchangeRateService');

/**
 * Get current exchange rates (Public)
 * GET /api/rates
 */
const getRates = async (req, res) => {
  try {
    const rates = await getExchangeRates();
    res.json({
      base: 'PKR',
      rates: rates.reduce((acc, r) => {
        acc[r.target_currency] = parseFloat(r.rate);
        return acc;
      }, {}),
      updatedAt: rates.length > 0 ? rates[0].updated_at : null,
    });
  } catch (err) {
    console.error('Get rates error:', err.message);
    res.status(500).json({ error: 'Failed to get exchange rates' });
  }
};

/**
 * Manually refresh exchange rates from the provider (Admin only)
 * POST /api/admin/rates/refresh
 */
const refreshRates = async (req, res) => {
  try {
    const rates = await updateExchangeRates();
    res.json({
      success: true,
      message: 'Exchange rates updated successfully',
      rates,
    });
  } catch (err) {
    console.error('Refresh rates error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Manually override a single currency's rate (Admin only)
 * PUT /api/admin/rates/:currency
 * Body: { rate: number }
 */
const setRate = async (req, res) => {
  try {
    const currency = String(req.params.currency || '').toUpperCase().trim();
    const rate = Number(req.body?.rate);

    if (!currency || currency.length < 2 || currency.length > 10) {
      return res.status(400).json({ error: 'Invalid currency code' });
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      return res.status(400).json({ error: 'Rate must be a positive number' });
    }

    const result = await pool.query(
      `UPDATE exchange_rates
       SET rate = $1, updated_at = NOW()
       WHERE target_currency = $2
       RETURNING target_currency, rate, updated_at`,
      [rate, currency]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Currency ${currency} not found` });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      currency: row.target_currency,
      rate: parseFloat(row.rate),
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error('Set rate error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getRates,
  refreshRates,
  setRate,
};