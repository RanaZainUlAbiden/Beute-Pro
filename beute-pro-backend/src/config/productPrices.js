/**
 * Static map of product IDs to their current prices (in PKR).
 * Kept in sync with frontend PRODUCTS array manually.
 * Used to validate order totals and snapshot prices.
 */
const PRODUCT_PRICES = {
  "aloe-vera-mist": 800,
  "cucumber-mist": 800,
  "neem-mist": 800,
  "lemon-mint-mist": 800,
  "rose-water-mist": 800,
  "botanical-essence-mist": 800,
  "almond-oil": 3000,
  "apricot-oil": 3000,
  "kalonji-oil": 3000,
  "sesame-seed-oil": 3000,
  "herbal-hair-oil": 3000,
  "amla-hair-oil": 3000,
  "almond-rose-soap": 1500,
  "aloe-vera-cucumber-soap": 1500,
  "charcoal-tea-tree-soap": 1500,
  "goat-milk-tea-tree-soap": 1500,
  "honey-oats-soap": 1500,
  "turmeric-neem-soap": 1500,
};

module.exports = PRODUCT_PRICES;