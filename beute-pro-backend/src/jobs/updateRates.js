const cron = require('node-cron');
const { updateExchangeRates } = require('../services/exchangeRateService');

/**
 * Schedule the exchange rate update job
 * Runs every 6 hours by default (configurable via .env)
 */
const startExchangeRateJob = () => {
  const cronSchedule = process.env.RATE_UPDATE_CRON || '0 */6 * * *';

  // Initial update on startup
  console.log('🔄 Fetching initial exchange rates...');
  updateExchangeRates().catch(err => {
    console.error('❌ Initial exchange rate update failed:', err.message);
  });

  // Schedule recurring updates
  cron.schedule(cronSchedule, async () => {
    console.log(`🔄 Running scheduled exchange rate update at ${new Date().toISOString()}`);
    try {
      await updateExchangeRates();
    } catch (err) {
      console.error('❌ Scheduled exchange rate update failed:', err.message);
    }
  });

  console.log(`⏰ Exchange rate update job scheduled (${cronSchedule})`);
};

module.exports = { startExchangeRateJob };