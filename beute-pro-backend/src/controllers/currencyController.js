const { getExchangeRates, updateExchangeRates } = require('../services/exchangeRateService');

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
 * Manually refresh exchange rates (Admin only)
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

module.exports = {
  getRates,
  refreshRates,
};