/* =============================================================
   BÉUTE PRO — PRODUCT DATA
   -------------------------------------------------------------
   This is the only file you need to edit to change products.

   HOW TO ADD A PRODUCT
   1. Copy one whole { ... } block below.
   2. Change "id" to a unique lowercase-with-dashes name.
   3. Drop the photos into  assets/img/products/
      and name them exactly:   <id>-1.jpg, <id>-2.jpg, <id>-3.jpg
      (the -1 image is the one shown in the grid)
   4. Fill in the English and Arabic text.

   NOTE ON PRICES
   Prices are plain numbers, no symbol and no commas.
   The currency symbol is set once in CURRENCY below.
   ============================================================= */

const CURRENCY = {
  code: "PKR",
  symbol: "\u20A8",       // ₨   — change to "AED" or "$" for the Dubai version
  symbolAr: "\u0631.\u0633" // ر.س style placeholder for the Arabic side
};

const CATEGORIES = [
  { id: "mists",             en: "Face Mists",        ar: "\u0636\u0628\u0627\u0628 \u0627\u0644\u0648\u062C\u0647" },
  { id: "serums",            en: "Serums",            ar: "\u0627\u0644\u0633\u064A\u0631\u0648\u0645" },
  { id: "soaps",             en: "Soaps",             ar: "\u0627\u0644\u0635\u0627\u0628\u0648\u0646" },
  { id: "cold-pressed-oils", en: "Cold Pressed Oils", ar: "\u0632\u064A\u0648\u062A \u0645\u0639\u0635\u0648\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0628\u0627\u0631\u062F" },
  { id: "hair-oils",         en: "Hair Oils",         ar: "\u0632\u064A\u0648\u062A \u0627\u0644\u0634\u0639\u0631" }
];

const PRODUCTS = [
  {
    id: "aloe-vera-mist",
    category: "mists",
    price: 800,
    oldPrice: null,          // set a number to show a strike-through sale price
    badge: "bestseller",     // "bestseller" | "new" | "sale" | null
    images: 3,               // how many photos exist for this product
    spin: true,              // true = show the 360° tab on the product page
    size: "120 ml (4.06 OZ)",
    en: {
      name: "Aloe Vera Face Mist",
      tagline: "Radiant glow. Hydrates the skin.",
      description: "A lightweight aloe vera mist that rehydrates tired skin in seconds. Full of micronutrients for skin rejuvenation, it calms redness and leaves a soft, natural glow without any greasy finish.",
      ingredients: ["Aloe Vera Extract", "Rose Water", "Glycerin", "Vitamin E", "Purified Water"],
      benefits: ["Instant hydration", "Calms irritation", "Refreshes makeup", "Paraben free"],
      usage: "Hold 20 cm from the face, close your eyes and spray twice. Use morning, evening, or any time skin feels dry."
    },
    ar: {
      name: "\u0636\u0628\u0627\u0628 \u0627\u0644\u0648\u062C\u0647 \u0645\u0639 \u0627\u0644\u0623\u0644\u0648\u0641\u064A\u0631\u0627",
      tagline: "\u0625\u0634\u0631\u0627\u0642 \u0637\u0628\u064A\u0639\u064A. \u064A\u0631\u0637\u0651\u0628 \u0627\u0644\u0628\u0634\u0631\u0629.",
      description: "\u0636\u0628\u0627\u0628 \u062E\u0641\u064A\u0641 \u0628\u062E\u0644\u0627\u0635\u0629 \u0627\u0644\u0623\u0644\u0648\u0641\u064A\u0631\u0627 \u064A\u0639\u064A\u062F \u0627\u0644\u062D\u064A\u0648\u064A\u0629 \u0644\u0644\u0628\u0634\u0631\u0629 \u0627\u0644\u0645\u062A\u0639\u0628\u0629 \u0641\u064A \u062B\u0648\u0627\u0646\u064D\u060C \u0645\u0644\u064A\u0621 \u0628\u0627\u0644\u0645\u063A\u0630\u0651\u064A\u0627\u062A \u0627\u0644\u062F\u0642\u064A\u0642\u0629 \u0644\u062A\u062C\u062F\u064A\u062F \u0634\u0628\u0627\u0628 \u0627\u0644\u0628\u0634\u0631\u0629.",
      ingredients: ["\u062E\u0644\u0627\u0635\u0629 \u0627\u0644\u0623\u0644\u0648\u0641\u064A\u0631\u0627", "\u0645\u0627\u0621 \u0627\u0644\u0648\u0631\u062F", "\u062C\u0644\u064A\u0633\u0631\u064A\u0646", "\u0641\u064A\u062A\u0627\u0645\u064A\u0646 \u0647\u0640", "\u0645\u0627\u0621 \u0646\u0642\u064A"],
      benefits: ["\u062A\u0631\u0637\u064A\u0628 \u0641\u0648\u0631\u064A", "\u064A\u0647\u062F\u0626 \u0627\u0644\u0627\u062D\u0645\u0631\u0627\u0631", "\u064A\u0646\u0639\u0634 \u0627\u0644\u0645\u0643\u064A\u0627\u062C", "\u062E\u0627\u0644\u064D \u0645\u0646 \u0627\u0644\u0628\u0627\u0631\u0627\u0628\u064A\u0646"],
      usage: "\u0631\u0634\u0651\u064A \u0645\u0631\u062A\u064A\u0646 \u0639\u0644\u0649 \u0628\u064F\u0639\u062F 20 \u0633\u0645 \u0645\u0646 \u0627\u0644\u0648\u062C\u0647 \u0645\u0639 \u0625\u063A\u0645\u0627\u0636 \u0627\u0644\u0639\u064A\u0646\u064A\u0646."
    }
  },

  {
    id: "cucumber-mist",
    category: "mists",
    price: 800,
    oldPrice: null,
    badge: "new",
    images: 3,
    spin: false,
    size: "120 ml (4.06 OZ)",
    en: {
      name: "Cucumber Face Mist",
      tagline: "Hydra boost. Calm and cool.",
      description: "A cooling cucumber mist that takes the heat out of sun-exposed skin. Light enough for daily use and gentle enough for sensitive skin.",
      ingredients: ["Cucumber Extract", "Witch Hazel", "Glycerin", "Purified Water"],
      benefits: ["Cools on contact", "Reduces puffiness", "Non-sticky", "Suits sensitive skin"],
      usage: "Spray onto clean skin whenever you need a cool-down. Keep refrigerated for an extra chill."
    },
    ar: {
      name: "\u0636\u0628\u0627\u0628 \u0627\u0644\u0648\u062C\u0647 \u0645\u0639 \u0627\u0644\u062E\u064A\u0627\u0631",
      tagline: "\u064A\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u0644\u0628\u0634\u0631\u0629 \u0647\u0627\u062F\u0626\u0629 \u0648\u0628\u0627\u0631\u062F\u0629.",
      description: "\u0636\u0628\u0627\u0628 \u0645\u0646\u0639\u0634 \u0628\u062E\u0644\u0627\u0635\u0629 \u0627\u0644\u062E\u064A\u0627\u0631 \u064A\u0644\u0637\u0651\u0641 \u0627\u0644\u0628\u0634\u0631\u0629 \u0627\u0644\u0645\u0639\u0631\u0651\u0636\u0629 \u0644\u0644\u0634\u0645\u0633.",
      ingredients: ["\u062E\u0644\u0627\u0635\u0629 \u0627\u0644\u062E\u064A\u0627\u0631", "\u0628\u0646\u062F\u0642 \u0627\u0644\u0633\u0627\u062D\u0631\u0629", "\u062C\u0644\u064A\u0633\u0631\u064A\u0646", "\u0645\u0627\u0621 \u0646\u0642\u064A"],
      benefits: ["\u0628\u0631\u0648\u062F\u0629 \u0641\u0648\u0631\u064A\u0629", "\u064A\u0642\u0644\u0644 \u0627\u0644\u0627\u0646\u062A\u0641\u0627\u062E", "\u063A\u064A\u0631 \u062F\u0647\u0646\u064A", "\u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0628\u0634\u0631\u0629 \u0627\u0644\u062D\u0633\u0627\u0633\u0629"],
      usage: "\u0631\u0634\u0651\u064A \u0639\u0644\u0649 \u0628\u0634\u0631\u0629 \u0646\u0638\u064A\u0641\u0629 \u0639\u0646\u062F \u0627\u0644\u062D\u0627\u062C\u0629."
    }
  },

  {
    id: "neem-mist",
    category: "mists",
    price: 800,
    oldPrice: null,
    badge: null,
    images: 3,
    spin: false,
    size: "120 ml (4.06 OZ)",
    en: {
      name: "Neem Face Mist",
      tagline: "Clears and balances oily skin.",
      description: "Neem has been used for generations to settle breakouts. This mist puts it in a form you can carry, balancing oil without stripping the skin.",
      ingredients: ["Neem Extract", "Tea Tree Oil", "Rose Water", "Purified Water"],
      benefits: ["Controls excess oil", "Helps clear breakouts", "Antibacterial", "Lightweight"],
      usage: "Spray twice over cleansed skin, morning and night. Avoid the eye area."
    },
    ar: {
      name: "\u0636\u0628\u0627\u0628 \u0627\u0644\u0648\u062C\u0647 \u0645\u0639 \u0627\u0644\u0646\u064A\u0645",
      tagline: "\u064A\u0646\u0642\u0651\u064A \u0627\u0644\u0628\u0634\u0631\u0629 \u0627\u0644\u062F\u0647\u0646\u064A\u0629 \u0648\u064A\u0648\u0627\u0632\u0646\u0647\u0627.",
      description: "\u064A\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0646\u064A\u0645 \u0645\u0646\u0630 \u0623\u062C\u064A\u0627\u0644 \u0644\u0639\u0644\u0627\u062C \u0627\u0644\u0628\u062B\u0648\u0631\u060C \u0648\u0647\u0630\u0627 \u0627\u0644\u0636\u0628\u0627\u0628 \u064A\u0648\u0627\u0632\u0646 \u0627\u0644\u062F\u0647\u0648\u0646 \u062F\u0648\u0646 \u062A\u062C\u0641\u064A\u0641 \u0627\u0644\u0628\u0634\u0631\u0629.",
      ingredients: ["\u062E\u0644\u0627\u0635\u0629 \u0627\u0644\u0646\u064A\u0645", "\u0632\u064A\u062A \u0634\u062C\u0631\u0629 \u0627\u0644\u0634\u0627\u064A", "\u0645\u0627\u0621 \u0627\u0644\u0648\u0631\u062F", "\u0645\u0627\u0621 \u0646\u0642\u064A"],
      benefits: ["\u064A\u0636\u0628\u0637 \u0627\u0644\u062F\u0647\u0648\u0646", "\u064A\u0633\u0627\u0639\u062F \u0639\u0644\u0649 \u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u0628\u0634\u0631\u0629", "\u0645\u0636\u0627\u062F \u0644\u0644\u0628\u0643\u062A\u064A\u0631\u064A\u0627", "\u062E\u0641\u064A\u0641"],
      usage: "\u0631\u0634\u0651\u064A \u0645\u0631\u062A\u064A\u0646 \u0635\u0628\u0627\u062D\u064B\u0627 \u0648\u0645\u0633\u0627\u0621\u064B \u0645\u0639 \u062A\u062C\u0646\u0651\u0628 \u0645\u062D\u064A\u0637 \u0627\u0644\u0639\u064A\u0646."
    }
  },

  {
    id: "almond-oil",
    category: "cold-pressed-oils",
    price: 3000,
    oldPrice: null,
    badge: "bestseller",
    images: 3,
    spin: false,
    size: "120 ml (4.06 OZ)",
    en: {
      name: "Almond Oil",
      tagline: "Cold pressed. Full of vitamins and antioxidants.",
      description: "Pressed without heat so the vitamin E survives the process. Light enough for the face, rich enough for dry patches, hair ends and cuticles.",
      ingredients: ["100% Cold Pressed Sweet Almond Oil"],
      benefits: ["Rich in vitamin E", "Softens dry skin", "Strengthens hair", "No additives"],
      usage: "Warm a few drops between the palms and massage into skin or scalp. Leave overnight for deeper conditioning."
    },
    ar: {
      name: "\u0632\u064A\u062A \u0627\u0644\u0644\u0648\u0632",
      tagline: "\u0645\u0639\u0635\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0628\u0627\u0631\u062F\u060C \u063A\u0646\u064A \u0628\u0627\u0644\u0641\u064A\u062A\u0627\u0645\u064A\u0646\u0627\u062A.",
      description: "\u064A\u064F\u0639\u0635\u0631 \u062F\u0648\u0646 \u062D\u0631\u0627\u0631\u0629 \u0644\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0641\u064A\u062A\u0627\u0645\u064A\u0646 \u0647\u0640\u060C \u062E\u0641\u064A\u0641 \u0644\u0644\u0648\u062C\u0647 \u0648\u063A\u0646\u064A \u0644\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u062C\u0627\u0641\u0629.",
      ingredients: ["\u0632\u064A\u062A \u0644\u0648\u0632 \u062D\u0644\u0648 \u0645\u0639\u0635\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0628\u0627\u0631\u062F 100%"],
      benefits: ["\u063A\u0646\u064A \u0628\u0641\u064A\u062A\u0627\u0645\u064A\u0646 \u0647\u0640", "\u064A\u0644\u064A\u0651\u0646 \u0627\u0644\u0628\u0634\u0631\u0629 \u0627\u0644\u062C\u0627\u0641\u0629", "\u064A\u0642\u0648\u0651\u064A \u0627\u0644\u0634\u0639\u0631", "\u0628\u062F\u0648\u0646 \u0625\u0636\u0627\u0641\u0627\u062A"],
      usage: "\u062F\u0641\u0651\u0626\u064A \u0642\u0637\u0631\u0627\u062A \u0628\u064A\u0646 \u0627\u0644\u0643\u0641\u064A\u0646 \u0648\u062F\u0644\u0651\u0643\u064A \u0627\u0644\u0628\u0634\u0631\u0629 \u0623\u0648 \u0641\u0631\u0648\u0629 \u0627\u0644\u0631\u0623\u0633."
    }
  },

  {
    id: "kalonji-oil",
    category: "cold-pressed-oils",
    price: 3000,
    oldPrice: 3500,
    badge: "sale",
    images: 3,
    spin: false,
    size: "120 ml (4.06 OZ)",
    en: {
      name: "Kalonji Oil",
      tagline: "Black seed, cold pressed.",
      description: "Black seed oil pressed from whole kalonji. Traditionally taken for immunity and applied for scalp and joint care.",
      ingredients: ["100% Cold Pressed Nigella Sativa Oil"],
      benefits: ["Supports immunity", "Scalp conditioning", "Antioxidant rich", "Single ingredient"],
      usage: "Apply to the scalp or affected area. Consult a physician before internal use."
    },
    ar: {
      name: "\u0632\u064A\u062A \u0627\u0644\u0643\u0644\u0648\u0646\u062C\u064A",
      tagline: "\u062D\u0628\u0629 \u0627\u0644\u0628\u0631\u0643\u0629\u060C \u0645\u0639\u0635\u0648\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0628\u0627\u0631\u062F.",
      description: "\u0632\u064A\u062A \u062D\u0628\u0629 \u0627\u0644\u0628\u0631\u0643\u0629 \u0627\u0644\u0645\u0639\u0635\u0648\u0631 \u0645\u0646 \u0627\u0644\u0628\u0630\u0648\u0631 \u0627\u0644\u0643\u0627\u0645\u0644\u0629\u060C \u064A\u064F\u0633\u062A\u062E\u062F\u0645 \u062A\u0642\u0644\u064A\u062F\u064A\u064B\u0627 \u0644\u062F\u0639\u0645 \u0627\u0644\u0645\u0646\u0627\u0639\u0629 \u0648\u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0628\u0641\u0631\u0648\u0629 \u0627\u0644\u0631\u0623\u0633.",
      ingredients: ["\u0632\u064A\u062A \u062D\u0628\u0629 \u0627\u0644\u0628\u0631\u0643\u0629 \u0627\u0644\u0645\u0639\u0635\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0628\u0627\u0631\u062F 100%"],
      benefits: ["\u064A\u062F\u0639\u0645 \u0627\u0644\u0645\u0646\u0627\u0639\u0629", "\u064A\u063A\u0630\u0651\u064A \u0641\u0631\u0648\u0629 \u0627\u0644\u0631\u0623\u0633", "\u063A\u0646\u064A \u0628\u0645\u0636\u0627\u062F\u0627\u062A \u0627\u0644\u0623\u0643\u0633\u062F\u0629", "\u0645\u0643\u0648\u0651\u0646 \u0648\u0627\u062D\u062F"],
      usage: "\u064A\u064F\u0637\u0628\u0651\u0642 \u0639\u0644\u0649 \u0641\u0631\u0648\u0629 \u0627\u0644\u0631\u0623\u0633 \u0623\u0648 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629."
    }
  },

  {
    id: "apricot-oil",
    category: "cold-pressed-oils",
    price: 3000,
    oldPrice: null,
    badge: null,
    images: 3,
    spin: false,
    size: "120 ml (4.06 OZ)",
    en: {
      name: "Apricot Oil",
      tagline: "Vitamin C and E for softer skin.",
      description: "A light, fast-absorbing oil that softens fine lines and evens rough texture without leaving a film.",
      ingredients: ["100% Cold Pressed Apricot Kernel Oil"],
      benefits: ["Absorbs quickly", "Softens fine lines", "Evens texture", "Non-comedogenic"],
      usage: "Massage two to three drops into clean skin at night."
    },
    ar: {
      name: "\u0632\u064A\u062A \u0627\u0644\u0645\u0634\u0645\u0634",
      tagline: "\u0641\u064A\u062A\u0627\u0645\u064A\u0646 \u0633\u064A \u0648\u0647\u0640 \u0644\u0628\u0634\u0631\u0629 \u0623\u0646\u0639\u0645.",
      description: "\u0632\u064A\u062A \u062E\u0641\u064A\u0641 \u0633\u0631\u064A\u0639 \u0627\u0644\u0627\u0645\u062A\u0635\u0627\u0635 \u064A\u0644\u0637\u0651\u0641 \u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u062F\u0642\u064A\u0642\u0629 \u0648\u064A\u0648\u062D\u0651\u062F \u0645\u0644\u0645\u0633 \u0627\u0644\u0628\u0634\u0631\u0629.",
      ingredients: ["\u0632\u064A\u062A \u0646\u0648\u0649 \u0627\u0644\u0645\u0634\u0645\u0634 \u0627\u0644\u0645\u0639\u0635\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0628\u0627\u0631\u062F 100%"],
      benefits: ["\u0627\u0645\u062A\u0635\u0627\u0635 \u0633\u0631\u064A\u0639", "\u064A\u0644\u0637\u0651\u0641 \u0627\u0644\u062E\u0637\u0648\u0637 \u0627\u0644\u062F\u0642\u064A\u0642\u0629", "\u064A\u0648\u062D\u0651\u062F \u0627\u0644\u0645\u0644\u0645\u0633", "\u0644\u0627 \u064A\u0633\u062F \u0627\u0644\u0645\u0633\u0627\u0645"],
      usage: "\u062F\u0644\u0651\u0643\u064A \u0642\u0637\u0631\u062A\u064A\u0646 \u0625\u0644\u0649 \u062B\u0644\u0627\u062B \u0639\u0644\u0649 \u0628\u0634\u0631\u0629 \u0646\u0638\u064A\u0641\u0629 \u0644\u064A\u0644\u064B\u0627."
    }
  },

  {
    id: "herbal-hair-oil",
    category: "hair-oils",
    price: 3000,
    oldPrice: null,
    badge: "bestseller",
    images: 3,
    spin: true,
    size: "120 ml (4.06 OZ)",
    en: {
      name: "Herbal Hair Oil",
      tagline: "Seventeen herbs. Total repair for damaged hair.",
      description: "Seventeen herbs infused into a base of light carrier oils, formulated for hair fall, thinning and a dry, flaking scalp.",
      ingredients: ["Amla", "Bhringraj", "Fenugreek", "Hibiscus", "Coconut Oil", "13 further herbs"],
      benefits: ["Reduces hair fall", "Strengthens roots", "Soothes the scalp", "Non-sticky"],
      usage: "Massage into the scalp and leave for at least one hour, or overnight, before washing."
    },
    ar: {
      name: "\u0632\u064A\u062A \u0627\u0644\u0634\u0639\u0631 \u0628\u0627\u0644\u0623\u0639\u0634\u0627\u0628",
      tagline: "\u0633\u0628\u0639\u0629 \u0639\u0634\u0631 \u0639\u0634\u0628\u0629 \u0644\u0625\u0635\u0644\u0627\u062D \u0627\u0644\u0634\u0639\u0631 \u0627\u0644\u062A\u0627\u0644\u0641.",
      description: "\u0633\u0628\u0639\u0629 \u0639\u0634\u0631 \u0639\u0634\u0628\u0629 \u0645\u0646\u0642\u0648\u0639\u0629 \u0641\u064A \u0632\u064A\u0648\u062A \u062E\u0641\u064A\u0641\u0629\u060C \u0645\u0635\u0645\u0645\u0629 \u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u062A\u0633\u0627\u0642\u0637 \u0627\u0644\u0634\u0639\u0631 \u0648\u062C\u0641\u0627\u0641 \u0641\u0631\u0648\u0629 \u0627\u0644\u0631\u0623\u0633.",
      ingredients: ["\u0627\u0644\u0623\u0645\u0644\u0627", "\u0627\u0644\u0628\u0631\u064A\u0646\u062C\u0631\u0627\u062C", "\u0627\u0644\u062D\u0644\u0628\u0629", "\u0627\u0644\u0643\u0631\u0643\u062F\u064A\u0647", "\u0632\u064A\u062A \u062C\u0648\u0632 \u0627\u0644\u0647\u0646\u062F", "\u0648\u0663\u0661 \u0639\u0634\u0628\u0629 \u0623\u062E\u0631\u0649"],
      benefits: ["\u064A\u0642\u0644\u0644 \u062A\u0633\u0627\u0642\u0637 \u0627\u0644\u0634\u0639\u0631", "\u064A\u0642\u0648\u0651\u064A \u0627\u0644\u062C\u0630\u0648\u0631", "\u064A\u0647\u062F\u0626 \u0641\u0631\u0648\u0629 \u0627\u0644\u0631\u0623\u0633", "\u063A\u064A\u0631 \u062F\u0647\u0646\u064A"],
      usage: "\u062F\u0644\u0651\u0643\u064A \u0641\u0631\u0648\u0629 \u0627\u0644\u0631\u0623\u0633 \u0648\u0627\u062A\u0631\u0643\u064A \u0627\u0644\u0632\u064A\u062A \u0633\u0627\u0639\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0642\u0628\u0644 \u0627\u0644\u063A\u0633\u0644."
    }
  },

  {
    id: "honey-oats-soap",
    category: "soaps",
    price: 1500,
    oldPrice: null,
    badge: "new",
    images: 3,
    spin: false,
    size: "100 g",
    en: {
      name: "Honey & Oats Soap",
      tagline: "Handcrafted. Gently exfoliating.",
      description: "Cut by hand from a cured batch. Ground oats give a soft physical exfoliation while honey keeps the skin from drying out.",
      ingredients: ["Raw Honey", "Ground Oats", "Coconut Oil", "Olive Oil", "Shea Butter"],
      benefits: ["Gentle exfoliation", "Keeps skin moisturised", "Handmade in small batches", "No harsh detergents"],
      usage: "Lather between wet hands and massage over the face or body. Rinse with warm water."
    },
    ar: {
      name: "\u0635\u0627\u0628\u0648\u0646 \u0627\u0644\u0639\u0633\u0644 \u0648\u0627\u0644\u0634\u0648\u0641\u0627\u0646",
      tagline: "\u0645\u0635\u0646\u0648\u0639 \u064A\u062F\u0648\u064A\u064B\u0627\u060C \u0645\u0642\u0634\u0651\u0631 \u0644\u0637\u064A\u0641.",
      description: "\u064A\u064F\u0642\u0637\u0651\u0639 \u064A\u062F\u0648\u064A\u064B\u0627 \u0645\u0646 \u062F\u0641\u0639\u0629 \u0645\u0639\u062A\u0651\u0642\u0629\u061B \u064A\u0645\u0646\u062D \u0627\u0644\u0634\u0648\u0641\u0627\u0646 \u062A\u0642\u0634\u064A\u0631\u064B\u0627 \u0646\u0627\u0639\u0645\u064B\u0627 \u0628\u064A\u0646\u0645\u0627 \u064A\u062D\u0645\u064A \u0627\u0644\u0639\u0633\u0644 \u0627\u0644\u0628\u0634\u0631\u0629 \u0645\u0646 \u0627\u0644\u062C\u0641\u0627\u0641.",
      ingredients: ["\u0639\u0633\u0644 \u062E\u0627\u0645", "\u0634\u0648\u0641\u0627\u0646 \u0645\u0637\u062D\u0648\u0646", "\u0632\u064A\u062A \u062C\u0648\u0632 \u0627\u0644\u0647\u0646\u062F", "\u0632\u064A\u062A \u0627\u0644\u0632\u064A\u062A\u0648\u0646", "\u0632\u0628\u062F\u0629 \u0627\u0644\u0634\u064A\u0627"],
      benefits: ["\u062A\u0642\u0634\u064A\u0631 \u0644\u0637\u064A\u0641", "\u064A\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u0644\u062A\u0631\u0637\u064A\u0628", "\u0645\u0635\u0646\u0648\u0639 \u0628\u062F\u0641\u0639\u0627\u062A \u0635\u063A\u064A\u0631\u0629", "\u0628\u062F\u0648\u0646 \u0645\u0646\u0638\u0641\u0627\u062A \u0642\u0627\u0633\u064A\u0629"],
      usage: "\u0631\u063A\u0651\u064A \u0627\u0644\u0635\u0627\u0628\u0648\u0646 \u0628\u064A\u0646 \u0627\u0644\u064A\u062F\u064A\u0646 \u0648\u062F\u0644\u0651\u0643\u064A \u0627\u0644\u0648\u062C\u0647 \u0623\u0648 \u0627\u0644\u062C\u0633\u0645\u060C \u062B\u0645 \u0627\u0634\u0637\u0641\u064A."
    }
  }
];
