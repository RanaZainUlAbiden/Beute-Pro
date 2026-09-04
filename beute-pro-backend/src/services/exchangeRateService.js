const pool = require('../config/db');
const axios = require('axios');

const API_URL = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate.host/latest';
const BASE_CURRENCY = process.env.BASE_CURRENCY || 'PKR';
const TARGET_CURRENCIES = (process.env.TARGET_CURRENCIES || 'USD,AED').split(',');

/**
 * Fetch latest exchange rates from exchangerate.host
 * Returns null if the API call fails or returns invalid data
 */
const fetchLatestRates = async () => {
  try {
    const response = await axios.get(API_URL, {
      params: {
        base: BASE_CURRENCY,
        symbols: TARGET_CURRENCIES.join(','),
      },
      timeout: 5000, // 5 seconds timeout
    });

    const data = response.data;
    // Check if the response is successful and contains rates
    if (!data || data.success === false || !data.rates) {
      console.error('Exchange rate API returned error:', data?.error || 'Unknown error');
      return null;
    }

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error.message);
    return null; // graceful failure
  }
};

/**
 * Update exchange rates in the database
 * If fetch fails, we keep existing rates and log a warning
 */
const updateExchangeRates = async () => {
  const rates = await fetchLatestRates();

  if (!rates) {
    console.warn('⚠️ Exchange rates not updated — using existing database values');
    return null;
  }

  for (const [currency, rate] of Object.entries(rates)) {
    if (currency === BASE_CURRENCY) continue;

    await pool.query(
      `INSERT INTO exchange_rates (target_currency, rate, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (target_currency) DO UPDATE
       SET rate = EXCLUDED.rate, updated_at = NOW()`,
      [currency, parseFloat(rate)]
    );
  }

  console.log(`✅ Exchange rates updated at ${new Date().toISOString()}`);
  return rates;
};

/**
 * Get current exchange rates from the database
 */
const getExchangeRates = async () => {
  const result = await pool.query(
    `SELECT target_currency, rate, updated_at
     FROM exchange_rates
     ORDER BY target_currency`
  );
  return result.rows;
};

/**
 * Get a specific exchange rate
 */
const getRateByCurrency = async (currency) => {
  const result = await pool.query(
    `SELECT rate FROM exchange_rates WHERE target_currency = $1`,
    [currency.toUpperCase()]
  );
  return result.rows[0] ? parseFloat(result.rows[0].rate) : null;
};

/**
 * Convert amount from PKR to target currency
 */
const convertAmount = async (amountPKR, targetCurrency) => {
  if (targetCurrency.toUpperCase() === 'PKR') {
    return amountPKR;
  }

  const rate = await getRateByCurrency(targetCurrency);
  if (!rate) {
    throw new Error(`Exchange rate not found for ${targetCurrency}`);
  }

  return amountPKR * rate;
};

module.exports = {
  fetchLatestRates,
  updateExchangeRates,
  getExchangeRates,
  getRateByCurrency,
  convertAmount,
};