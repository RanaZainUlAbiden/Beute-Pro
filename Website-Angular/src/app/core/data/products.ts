/* =============================================================
   BÉUTE PRO — PRODUCT DATA
   -------------------------------------------------------------
   This is the only file you need to edit to change products.

   HOW TO ADD A PRODUCT
   1. Copy one whole { ... } block below.
   2. Change "id" to a unique lowercase-with-dashes name.
   3. Drop the photos into  public/assets/img/products/
      and name them exactly:   <id>-1.png, <id>-2.png, <id>-3.png
      (the -1 image is the one shown in the grid)
   4. Fill in the English and Arabic text.

   NOTE ON PRICES
   Prices are plain numbers, no symbol and no commas.
   The currency symbol is set once in CURRENCY below.
   ============================================================= */

import type { Category, Currency, Product } from '../models/product';

export const CURRENCY: Currency = {
  "code": "PKR",
  "symbol": "₨",
  "symbolAr": "ر.س"
};

export const CATEGORIES: readonly Category[] = [
  {
    "id": "mists",
    "en": "Face Mists",
    "ar": "ضباب الوجه"
  },
  {
    "id": "serums",
    "en": "Serums",
    "ar": "السيروم"
  },
  {
    "id": "soaps",
    "en": "Soaps",
    "ar": "الصابون"
  },
  {
    "id": "cold-pressed-oils",
    "en": "Cold Pressed Oils",
    "ar": "زيوت معصورة على البارد"
  },
  {
    "id": "hair-oils",
    "en": "Hair Oils",
    "ar": "زيوت الشعر"
  }
];

export const PRODUCTS: readonly Product[] = [
  {
    "id": "aloe-vera-mist",
    "category": "mists",
    "price": 800,
    "oldPrice": null,
    "badge": "bestseller",
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Aloe Vera Face Mist",
      "tagline": "Cooling hydration for dull, tired skin.",
      "description": "Béute Pro Organic Aloe Vera Face Mist delivers a cooling boost of hydration while moisturizing and rejuvenating dull skin, leaving the skin feeling refreshed and radiant.",
      "ingredients": [
        "Pure Aloe Vera Extract (Aloe Barbadensis Leaf Extract)",
        "Aqua",
        "Glycerine (Glycerolum)",
        "EDTA (Disodium EDTA)",
        "Vitamin B3 (Niacinamide)",
        "Hyaluronic Acid",
        "Rice Water"
      ],
      "benefits": [
        "Supports the production and release of collagen",
        "Can speed up wound healing time and limits scarring",
        "Has an antioxidant effect that can help repair sun damage & slow down the aging process",
        "Helps to make the skin more flexible and supple, rather than stiff and leathery"
      ],
      "usage": "Spray 2-3 times evenly across the face and neck, any time during the day, to refresh and moisturize the skin. Can be used for instant hydration, as a toner, or as a primer before or to set makeup."
    },
    "ar": {
      "name": "ضباب الوجه مع الألوفيرا",
      "tagline": "ترطيب منعش وبارد للبشرة الباهتة والمتعبة.",
      "description": "يمنح ضباب الألوفيرا العضوي من بيوتي برو دفعة منعشة من الترطيب مع ترطيب وتجديد البشرة الباهتة، تاركًا البشرة منتعشة ومشرقة.",
      "ingredients": [
        "مستخلص الألوفيرا النقي",
        "ماء",
        "جليسرين",
        "إي دي تي إيه (EDTA)",
        "فيتامين B3 (نياسيناميد)",
        "حمض الهيالورونيك",
        "ماء الأرز"
      ],
      "benefits": [
        "يدعم إنتاج الكولاجين وإفرازه",
        "يسرّع وقت التئام الجروح ويقلل التندّب",
        "له تأثير مضاد للأكسدة يساعد على إصلاح أضرار الشمس وإبطاء الشيخوخة",
        "يساعد على جعل البشرة أكثر مرونة ونعومة بدلًا من الجفاف والتصلّب"
      ],
      "usage": "رشّي 2-3 مرات بالتساوي على الوجه والرقبة في أي وقت من اليوم لتنعش البشرة وترطبها. يمكن استخدامه للترطيب الفوري، كتونر، أو كبرايمر قبل المكياج أو لتثبيته."
    }
  },
  {
    "id": "cucumber-mist",
    "category": "mists",
    "price": 800,
    "oldPrice": null,
    "badge": "new",
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Cucumber Face Mist",
      "tagline": "Refreshing cucumber mist that balances and cools.",
      "description": "Cucumber Face Mist instantly refreshes, soothes, helps balance the skin's pH and provides an array of vitamins, minerals and antioxidants. This refreshing cucumber mist offers restorative properties that leave your skin feeling even, hydrated, and radiant.",
      "ingredients": [
        "Pure Cucumber Extract (Cucumis Sativus Fruit Extract)",
        "Aqua",
        "Glycerine (Glycerolum)",
        "EDTA (Disodium EDTA)",
        "Vitamin B3 (Niacinamide)",
        "Hyaluronic Acid",
        "Rice Water"
      ],
      "benefits": [
        "Calming and anti-inflammatory properties that help soothe blemishes and minor skin irritations",
        "Mildly astringent — balances oil production and reduces the appearance of age spots, freckles & pores",
        "Tones and tightens skin for anti-aging benefits",
        "Cooling properties, perfect for reducing puffiness and soothing sunburn or acne irritation"
      ],
      "usage": "Spray 2-3 times evenly across the face and neck, any time during the day, to refresh and moisturize the skin. Can be used for instant hydration, as a toner, or as a primer before or to set makeup."
    },
    "ar": {
      "name": "ضباب الوجه مع الخيار",
      "tagline": "ضباب خيار منعش يوازن البشرة ويبردها.",
      "description": "ينعش ضباب الخيار البشرة فورًا، يهدئها، يساعد على موازنة درجة حموضتها، ويوفر مجموعة من الفيتامينات والمعادن ومضادات الأكسدة. يترك بشرتك متوازنة ورطبة ومشرقة.",
      "ingredients": [
        "مستخلص الخيار النقي",
        "ماء",
        "جليسرين",
        "إي دي تي إيه (EDTA)",
        "فيتامين B3 (نياسيناميد)",
        "حمض الهيالورونيك",
        "ماء الأرز"
      ],
      "benefits": [
        "خصائص مهدئة ومضادة للالتهاب تساعد على تهدئة البثور وتهيجات البشرة البسيطة",
        "قابض خفيف يوازن إفراز الزيوت ويقلل ظهور البقع الداكنة والنمش والمسام",
        "ينعّم البشرة ويشدّها لفوائد مضادة للشيخوخة",
        "خصائص مبرّدة، مثالية لتقليل الانتفاخ وتهدئة حروق الشمس أو تهيج حب الشباب"
      ],
      "usage": "رشّي 2-3 مرات بالتساوي على الوجه والرقبة في أي وقت من اليوم لتنعش البشرة وترطبها. يمكن استخدامه للترطيب الفوري، كتونر، أو كبرايمر قبل المكياج أو لتثبيته."
    }
  },
  {
    "id": "neem-mist",
    "category": "mists",
    "price": 800,
    "oldPrice": null,
    "badge": null,
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Neem Face Mist",
      "tagline": "Anti-bacterial neem mist for acne-prone skin.",
      "description": "Béute Pro Neem Face Mist is full of anti-bacterial & anti-inflammatory properties, making this mist perfect for those with acne prone skin.",
      "ingredients": [
        "Pure Neem Hydrosol (Azadirachta Indica)",
        "Aqua",
        "Glycerine (Glycerolum)",
        "EDTA (Disodium EDTA)",
        "Vitamin B3 (Niacinamide)",
        "Hyaluronic Acid",
        "Rice Water"
      ],
      "benefits": [
        "Helps dry skin, pimples, rashes & zits, and could be used for all skin types"
      ],
      "usage": "Spray 2-3 times evenly across the face and neck, any time during the day, to refresh and moisturize the skin. Can be used for instant hydration, as a toner, or as a primer before or to set makeup."
    },
    "ar": {
      "name": "ضباب الوجه مع النيم",
      "tagline": "ضباب النيم المضاد للبكتيريا للبشرة المعرضة لحب الشباب.",
      "description": "ضباب النيم من بيوتي برو مليء بالخصائص المضادة للبكتيريا والالتهابات، مما يجعله مثاليًا لمن يعاني البشرة المعرضة لحب الشباب.",
      "ingredients": [
        "مقطر النيم النقي",
        "ماء",
        "جليسرين",
        "إي دي تي إيه (EDTA)",
        "فيتامين B3 (نياسيناميد)",
        "حمض الهيالورونيك",
        "ماء الأرز"
      ],
      "benefits": [
        "يساعد على تهدئة البشرة الجافة وحب الشباب والطفح الجلدي والبثور، ويمكن استخدامه لجميع أنواع البشرة"
      ],
      "usage": "رشّي 2-3 مرات بالتساوي على الوجه والرقبة في أي وقت من اليوم لتنعش البشرة وترطبها. يمكن استخدامه للترطيب الفوري، كتونر، أو كبرايمر قبل المكياج أو لتثبيته."
    }
  },
  {
    "id": "lemon-mint-mist",
    "category": "mists",
    "price": 800,
    "oldPrice": null,
    "badge": "new",
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Face Mist Lemon & Mint",
      "tagline": "Citrus-fresh mist for a clear, matte finish.",
      "description": "This clarifying mist blends lemon's natural astringent properties with mint's cooling effect for a fresh, matte finish. Specially formulated with natural ingredients, vitamins and extracts to give facial skin an instant hit of hydration. This citrusy concoction lightens blemishes, leaving your skin soft, supple and hydrated.",
      "ingredients": [
        "Pure Lemon Extract (Citrus Limon Fruit Extract)",
        "Aqua",
        "Glycerine (Glycerolum)",
        "EDTA (Disodium EDTA)",
        "Vitamin B3 (Niacinamide)",
        "Hyaluronic Acid",
        "Rice Water"
      ],
      "benefits": [
        "Removes excess oil buildup from facial skin",
        "Balances skin pH levels",
        "Refreshes and brightens skin with energizing lemon",
        "Helps with sunburns, brightens skin, reduces blemishes and acne-scars, removes dirt from pores",
        "Antibacterial, antioxidant, natural antiseptic properties"
      ],
      "usage": "Spray 2-3 times evenly across the face and neck, any time during the day, to refresh and moisturize the skin. Can be used for instant hydration, as a toner, or as a primer before or to set makeup."
    },
    "ar": {
      "name": "ضباب الوجه بالليمون والنعناع",
      "tagline": "ضباب منعش بلمسة حمضية لبشرة نقية وغير لامعة.",
      "description": "يمزج هذا الضباب المنقّي بين الخصائص القابضة الطبيعية لليمون والتأثير المبرّد للنعناع للحصول على انتعاش ومظهر غير لامع. مصمم خصيصًا بمكونات طبيعية وفيتامينات ومستخلصات لمنح بشرة الوجه دفعة فورية من الترطيب. هذا المزيج الحمضي يفتّح البقع، تاركًا بشرتك ناعمة ومرنة ورطبة.",
      "ingredients": [
        "مستخلص الليمون النقي",
        "ماء",
        "جليسرين",
        "إي دي تي إيه (EDTA)",
        "فيتامين B3 (نياسيناميد)",
        "حمض الهيالورونيك",
        "ماء الأرز"
      ],
      "benefits": [
        "يزيل تراكم الزيوت الزائدة من بشرة الوجه",
        "يوازن مستويات حموضة البشرة",
        "ينعش البشرة ويضيء مظهرها بفضل طاقة الليمون",
        "يساعد على تهدئة حروق الشمس، وتفتيح البشرة، وتقليل البقع وآثار حب الشباب، وتنظيف المسام",
        "خصائص مضادة للبكتيريا ومضادة للأكسدة ومطهرة طبيعية"
      ],
      "usage": "رشّي 2-3 مرات بالتساوي على الوجه والرقبة في أي وقت من اليوم لتنعش البشرة وترطبها. يمكن استخدامه للترطيب الفوري، كتونر، أو كبرايمر قبل المكياج أو لتثبيته."
    }
  },
  {
    "id": "rose-water-mist",
    "category": "mists",
    "price": 800,
    "oldPrice": null,
    "badge": null,
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Face Mist Rose Water",
      "tagline": "Pure, steam-distilled rose water mist.",
      "description": "Béute Pro Pure Rose Water Face Mist is formulated with nature's finest rose petals, steam distilled to perfection for the purest and most aromatic flower water. Being rich in antioxidants enables it to protect the skin from oxidative stress and to keep it healthy and youthful.",
      "ingredients": [
        "Rose Floral Water (Rosa Damascena)",
        "Aqua",
        "Glycerine (Glycerolum)",
        "EDTA (Disodium EDTA)",
        "Vitamin B3 (Niacinamide)",
        "Hyaluronic Acid",
        "Rice Water"
      ],
      "benefits": [
        "Helps dry skin, pimples, rashes & zits, and could be used for all skin types"
      ],
      "usage": "Spray 2-3 times evenly across the face and neck, any time during the day, to refresh and moisturize the skin. Can be used for instant hydration, as a toner, or as a primer before or to set makeup."
    },
    "ar": {
      "name": "ضباب ماء الورد",
      "tagline": "ضباب ماء ورد نقي مقطر بالبخار.",
      "description": "يُصاغ ضباب ماء الورد النقي من بيوتي برو من أجود بتلات الورد المقطرة بالبخار للحصول على أنقى وأعطر ماء زهور. غناه بمضادات الأكسدة يمكّنه من حماية البشرة من الإجهاد التأكسدي والحفاظ على صحتها ونضارتها.",
      "ingredients": [
        "ماء الورد (الورد الدمشقي)",
        "ماء",
        "جليسرين",
        "إي دي تي إيه (EDTA)",
        "فيتامين B3 (نياسيناميد)",
        "حمض الهيالورونيك",
        "ماء الأرز"
      ],
      "benefits": [
        "يساعد على تهدئة البشرة الجافة وحب الشباب والطفح الجلدي والبثور، ويمكن استخدامه لجميع أنواع البشرة"
      ],
      "usage": "رشّي 2-3 مرات بالتساوي على الوجه والرقبة في أي وقت من اليوم لتنعش البشرة وترطبها. يمكن استخدامه للترطيب الفوري، كتونر، أو كبرايمر قبل المكياج أو لتثبيته."
    }
  },
  {
    "id": "botanical-essence-mist",
    "category": "mists",
    "price": 800,
    "oldPrice": null,
    "badge": null,
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Face Mist Botanical Essence",
      "tagline": "A multi-botanical blend for balanced, calm skin.",
      "description": "Béute Pro Botanical Essence Face Mist is full of anti-bacterial & anti-inflammatory properties, making this mist perfect for those with acne prone skin.",
      "ingredients": [
        "Aloe Vera Extract (Aloe Barbadensis Leaf Extract)",
        "Rose Floral Water (Rosa Damascena)",
        "Pure Lemon & Mint Extracts (Citrus Limon & Mentha Extracts)",
        "Pure Cucumber Extract (Cucumis Sativus Fruit Extract)",
        "Pure Neem Hydrosol (Azadirachta Indica)",
        "Tea Tree Oil (Melaleuca Alternifolia Leaf Oil)",
        "Rice Water (Oryza Sativa)",
        "Aqua",
        "Glycerine (Glycerolum)",
        "EDTA (Disodium EDTA)",
        "Vitamin B3 (Niacinamide)"
      ],
      "benefits": [
        "Balances and hydrates mature, dehydrated & dry skin",
        "Soothes and nourishes depleted or irritated skin",
        "Tones and protects skin's microbiome",
        "Tones & gently cleanses skin"
      ],
      "usage": "Spray 2-3 times evenly across the face and neck, any time during the day, to refresh and moisturize the skin. Can be used for instant hydration, as a toner, or as a primer before or to set makeup."
    },
    "ar": {
      "name": "ضباب الجوهر النباتي",
      "tagline": "مزيج نباتي متعدد لبشرة متوازنة وهادئة.",
      "description": "ضباب الجوهر النباتي من بيوتي برو مليء بالخصائص المضادة للبكتيريا والالتهابات، مما يجعله مثاليًا لمن يعاني البشرة المعرضة لحب الشباب.",
      "ingredients": [
        "مستخلص الألوفيرا",
        "ماء الورد (الورد الدمشقي)",
        "مستخلصا الليمون والنعناع النقيان",
        "مستخلص الخيار النقي",
        "مقطر النيم النقي",
        "زيت شجرة الشاي",
        "ماء الأرز",
        "ماء",
        "جليسرين",
        "إي دي تي إيه (EDTA)",
        "فيتامين B3 (نياسيناميد)"
      ],
      "benefits": [
        "يوازن ويرطّب البشرة الناضجة أو الجافة أو المفتقدة للرطوبة",
        "يهدئ ويغذّي البشرة المرهقة أو المتهيجة",
        "ينظم ويحمي ميكروبيوم البشرة",
        "ينعش وينظف البشرة بلطف"
      ],
      "usage": "رشّي 2-3 مرات بالتساوي على الوجه والرقبة في أي وقت من اليوم لتنعش البشرة وترطبها. يمكن استخدامه للترطيب الفوري، كتونر، أو كبرايمر قبل المكياج أو لتثبيته."
    }
  },
  {
    "id": "almond-oil",
    "category": "cold-pressed-oils",
    "price": 3000,
    "oldPrice": null,
    "badge": "bestseller",
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Almond Oil",
      "tagline": "Rich in vitamin E. Nourishes skin and hair.",
      "description": "Our Almond Oil is a versatile everyday essential, naturally rich in vitamin E and essential fatty acids. It helps deeply nourish dry skin, restore softness, and improve the look and feel of hair, leaving it silky, smooth, and healthy looking.",
      "ingredients": [
        "100% Cold Pressed Sweet Almond Oil"
      ],
      "benefits": [
        "Moisturizes dry, sensitive, or flaky skin",
        "Fades dark circles and soothes puffiness around the eyes",
        "Strengthens hair from root to tip and adds a silky shine",
        "Treats dandruff and calms an itchy scalp",
        "Acts as a natural makeup remover and skin barrier enhancer"
      ],
      "usage": "Lightweight and non-greasy — apply directly to hair, scalp, and skin, or consume orally in moderation."
    },
    "ar": {
      "name": "زيت اللوز",
      "tagline": "غني بفيتامين E. يغذي البشرة والشعر.",
      "description": "زيتنا من اللوز عنصر أساسي يومي متعدد الاستخدامات، غني طبيعيًا بفيتامين E والأحماض الدهنية الأساسية. يساعد على تغذية البشرة الجافة بعمق واستعادة نعومتها، وتحسين مظهر الشعر وملمسه ليصبح حريريًا وناعمًا وصحيًا.",
      "ingredients": [
        "زيت اللوز الحلو المعصور على البارد 100%"
      ],
      "benefits": [
        "يرطّب البشرة الجافة أو الحساسة أو المتقشرة",
        "يقلل الهالات الداكنة ويهدئ الانتفاخ حول العينين",
        "يقوّي الشعر من الجذور إلى الأطراف ويمنحه لمعانًا حريريًا",
        "يعالج القشرة ويهدئ فروة الرأس المثيرة للحكة",
        "يعمل كمزيل طبيعي للمكياج ويعزز حاجز البشرة"
      ],
      "usage": "خفيف وغير دهني — يُطبّق مباشرة على الشعر وفروة الرأس والبشرة، أو يُتناول بالفم باعتدال."
    }
  },
  {
    "id": "apricot-oil",
    "category": "cold-pressed-oils",
    "price": 3000,
    "oldPrice": null,
    "badge": null,
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Apricot Oil",
      "tagline": "Lightweight hydration rich in vitamins A and E.",
      "description": "Lightweight yet deeply nourishing, our Apricot Oil is enriched with vitamins A and E to deliver lasting hydration without feeling heavy. It absorbs beautifully into the skin and hair, leaving them soft, smooth, and naturally radiant.",
      "ingredients": [
        "100% Cold Pressed Apricot Kernel Oil"
      ],
      "benefits": [
        "Hydrates and smoothes skin without leaving a residue",
        "Reduces fine lines and signs of aging",
        "Promotes soft, manageable hair",
        "Acts as a soothing carrier oil for essential oils",
        "Helps calm inflamed or sun-damaged skin",
        "Full of Vitamin C & E"
      ],
      "usage": "Use as a lightweight face oil or apply to hair ends to tame frizz and add shine."
    },
    "ar": {
      "name": "زيت المشمش",
      "tagline": "ترطيب خفيف غني بفيتاميني A وE.",
      "description": "زيت المشمش خفيف وغني بالتغذية في آن واحد، معزز بفيتاميني A وE لترطيب يدوم دون الشعور بالثقل. يمتص بسهولة في البشرة والشعر، تاركًا إياهما ناعمين ومتألقين بشكل طبيعي.",
      "ingredients": [
        "زيت نوى المشمش المعصور على البارد 100%"
      ],
      "benefits": [
        "يرطّب وينعّم البشرة دون ترك أي أثر دهني",
        "يقلل الخطوط الدقيقة وعلامات التقدم في السن",
        "يمنح الشعر نعومة وسهولة في التصفيف",
        "يعمل كزيت ناقل مهدئ للزيوت العطرية",
        "يساعد على تهدئة البشرة الملتهبة أو المتضررة من الشمس",
        "غني بفيتاميني C وE"
      ],
      "usage": "استخدميه كزيت خفيف للوجه أو ضعيه على أطراف الشعر لتهدئة التجعّد ومنحه لمعانًا."
    }
  },
  {
    "id": "kalonji-oil",
    "category": "cold-pressed-oils",
    "price": 3000,
    "oldPrice": null,
    "badge": null,
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Black Seed Oil",
      "tagline": "Traditional black seed oil for skin, hair and immunity.",
      "description": "Black Seed Oil is a timeless remedy steeped in tradition, known for its therapeutic, anti-inflammatory, and immune-boosting properties.",
      "ingredients": [
        "100% Cold Pressed Nigella Sativa (Black Seed) Oil"
      ],
      "benefits": [
        "Fights acne, eczema, and skin irritation",
        "Promotes hair growth and combats premature greying",
        "Boosts immunity when taken orally in moderation",
        "Helps reduce joint inflammation and muscle aches",
        "Balances scalp health and soothes itchiness",
        "Full of Vitamin C & E"
      ],
      "usage": "Take ½ tsp daily or apply to the scalp for faster hair growth and reduced hair fall."
    },
    "ar": {
      "name": "زيت حبة البركة",
      "tagline": "زيت حبة البركة التقليدي للبشرة والشعر والمناعة.",
      "description": "زيت حبة البركة علاج تقليدي عريق معروف بخصائصه العلاجية والمضادة للالتهاب والداعمة للمناعة.",
      "ingredients": [
        "زيت حبة البركة (الكلونجي) المعصور على البارد 100%"
      ],
      "benefits": [
        "يحارب حب الشباب والإكزيما وتهيج البشرة",
        "يعزز نمو الشعر ويقاوم الشيب المبكر",
        "يقوّي المناعة عند تناوله بالفم باعتدال",
        "يساعد على تخفيف التهاب المفاصل وآلام العضلات",
        "يوازن صحة فروة الرأس ويهدئ الحكة",
        "غني بفيتاميني C وE"
      ],
      "usage": "تناولي نصف ملعقة صغيرة يوميًا أو ضعيه على فروة الرأس لتحفيز نمو الشعر وتقليل تساقطه."
    }
  },
  {
    "id": "sesame-seed-oil",
    "category": "cold-pressed-oils",
    "price": 3000,
    "oldPrice": null,
    "badge": "new",
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Sesame Seed Oil",
      "tagline": "Nourishing oil inspired by South Asian beauty rituals.",
      "description": "Inspired by centuries of South Asian beauty rituals, our Sesame Oil is a nourishing essential for both skin and hair. Naturally rich in antioxidants, vitamins, and essential fatty acids, it helps replenish moisture, support the skin's natural barrier, and leave hair feeling soft, strong, and healthy.",
      "ingredients": [
        "100% Cold Pressed Sesame Oil"
      ],
      "benefits": [
        "Deeply hydrates and firms the skin",
        "Enhances scalp circulation and reduces hair fall",
        "Alleviates joint and muscle pain when used in massage",
        "Protects skin from pollution and sun damage",
        "Contains natural antibacterial properties",
        "Full of Vitamin E & Antioxidants"
      ],
      "usage": "Can be used for oil pulling, consumed in moderation, and applied to skin and scalp."
    },
    "ar": {
      "name": "زيت السمسم",
      "tagline": "زيت مغذّي مستوحى من طقوس الجمال في جنوب آسيا.",
      "description": "مستوحى من قرون من طقوس الجمال في جنوب آسيا، زيت السمسم عنصر مغذّي أساسي للبشرة والشعر. غني طبيعيًا بمضادات الأكسدة والفيتامينات والأحماض الدهنية الأساسية، يساعد على تجديد الترطيب ودعم حاجز البشرة الطبيعي وترك الشعر ناعمًا وقويًا وصحيًا.",
      "ingredients": [
        "زيت السمسم المعصور على البارد 100%"
      ],
      "benefits": [
        "يرطّب البشرة بعمق ويشدّها",
        "يعزز الدورة الدموية في فروة الرأس ويقلل تساقط الشعر",
        "يخفّف آلام المفاصل والعضلات عند استخدامه في التدليك",
        "يحمي البشرة من التلوث وأضرار الشمس",
        "يحتوي على خصائص طبيعية مضادة للبكتيريا",
        "غني بفيتامين E ومضادات الأكسدة"
      ],
      "usage": "يمكن استخدامه لسحب الزيت (Oil Pulling)، أو تناوله باعتدال، أو وضعه على البشرة وفروة الرأس."
    }
  },
  {
    "id": "herbal-hair-oil",
    "category": "hair-oils",
    "price": 3000,
    "oldPrice": null,
    "badge": "bestseller",
    "images": 1,
    "spin": true,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Herbal Hair Oil",
      "tagline": "A blend of seventeen herbs for hair care.",
      "description": "Béute Pro's Herbal Hair Oil blends seventeen herbs into a single hair oil formula.",
      "ingredients": [
        "Blend of 17 Herbs (specific herbs not disclosed by manufacturer)"
      ],
      "benefits": [],
      "usage": "Massage into the scalp and hair, then rinse off after use."
    },
    "ar": {
      "name": "زيت الشعر بالأعشاب",
      "tagline": "مزيج من سبعة عشر عشبة لعناية الشعر.",
      "description": "يجمع زيت الشعر بالأعشاب من بيوتي برو سبعة عشر عشبة في تركيبة واحدة.",
      "ingredients": [
        "مزيج من 17 عشبة (الشركة المصنّعة لم تفصح عن أسمائها)"
      ],
      "benefits": [],
      "usage": "دلّكي فروة الرأس والشعر بالزيت ثم اشطفيه بعد الاستخدام."
    }
  },
  {
    "id": "amla-hair-oil",
    "category": "hair-oils",
    "price": 3000,
    "oldPrice": null,
    "badge": "new",
    "images": 1,
    "spin": false,
    "size": "120 ml (4.06 OZ)",
    "en": {
      "name": "Amla Hair Oil",
      "tagline": "Traditional amla oil for stronger, shinier hair.",
      "description": "Inspired by generations of South Asian haircare traditions, our Amla Oil is formulated to nourish the scalp and strengthen hair from root to tip. Rich in naturally occurring antioxidants, it helps improve shine, reduce the appearance of dryness, and leave hair looking fuller, healthier, and beautifully revitalized.",
      "ingredients": [
        "100% Amla (Indian Gooseberry) Oil"
      ],
      "benefits": [
        "Strengthens hair from the roots and reduces breakage",
        "Promotes thicker, longer hair growth and slows premature greying",
        "Adds shine and smoothness to dull, damaged strands",
        "Helps eliminate dandruff and soothes itchy scalp",
        "Cools the scalp and supports overall scalp health"
      ],
      "usage": "For external use only. Apply generously to scalp and hair, leave on for at least 1 hour before rinsing. Use 2–3 times a week for best results."
    },
    "ar": {
      "name": "زيت الأملا للشعر",
      "tagline": "زيت الأملا التقليدي لشعر أقوى وأكثر لمعانًا.",
      "description": "مستوحى من أجيال من تقاليد العناية بالشعر في جنوب آسيا، صُمّم زيت الأملا لتغذية فروة الرأس وتقوية الشعر من الجذور إلى الأطراف. غني بمضادات الأكسدة الطبيعية، يساعد على تحسين اللمعان وتقليل مظهر الجفاف وترك الشعر يبدو أكثف وأصح ومنعشًا.",
      "ingredients": [
        "زيت الأملا (عنب الثعلب الهندي) 100%"
      ],
      "benefits": [
        "يقوّي الشعر من جذوره ويقلل تكسّره",
        "يعزز نمو شعر أكثر كثافة وطولًا ويبطئ الشيب المبكر",
        "يمنح الخصلات الباهتة والمتضررة لمعانًا ونعومة",
        "يساعد على القضاء على القشرة ويهدئ فروة الرأس المثيرة للحكة",
        "يبرّد فروة الرأس ويدعم صحتها العامة"
      ],
      "usage": "للاستخدام الخارجي فقط، ضعيه بسخاء على فروة الرأس والشعر واتركيه لمدة ساعة على الأقل قبل الشطف. استخدميه 2-3 مرات أسبوعيًا للحصول على أفضل النتائج."
    }
  },
  {
    "id": "almond-rose-soap",
    "category": "soaps",
    "price": 1500,
    "oldPrice": null,
    "badge": "new",
    "images": 1,
    "spin": false,
    "size": "100 g",
    "en": {
      "name": "Rose & Almond Soap",
      "tagline": "A luxurious bar for softness and radiance.",
      "description": "Combining the elegance of rose with the nourishing properties of almond, this luxurious bar gently cleanses while restoring softness and radiance.",
      "ingredients": [],
      "benefits": [
        "Promotes even skin tone and a natural glow",
        "Moisturizes and smooths rough patches",
        "Calms sensitivity and adds a gentle floral aroma",
        "Suitable for all skin types, including dry and mature skin"
      ],
      "usage": "Wet the bar, lather between wet hands, and massage onto skin. Rinse thoroughly with water."
    },
    "ar": {
      "name": "صابون الورد واللوز",
      "tagline": "قالب فاخر لنعومة وإشراقة البشرة.",
      "description": "يجمع هذا القالب الفاخر بين أناقة الورد وخصائص اللوز المغذّية، لينظّف البشرة بلطف مع استعادة نعومتها وإشراقها.",
      "ingredients": [],
      "benefits": [
        "يعزز توحيد لون البشرة وإشراقها الطبيعية",
        "يرطّب وينعّم المناطق الخشنة",
        "يهدئ الحساسية ويضيف رائحة زهرية لطيفة",
        "مناسب لجميع أنواع البشرة، بما في ذلك الجافة والناضجة"
      ],
      "usage": "بلّلي القالب ورغّيه بين يدين مبلّلتين، ثم دلّكي به البشرة واشطفيه جيدًا بالماء."
    }
  },
  {
    "id": "aloe-vera-cucumber-soap",
    "category": "soaps",
    "price": 1500,
    "oldPrice": null,
    "badge": null,
    "images": 1,
    "spin": false,
    "size": "100 g",
    "en": {
      "name": "Aloe Vera & Cucumber Soap",
      "tagline": "Soothing hydration for sensitive, sun-exposed skin.",
      "description": "Enriched with soothing aloe vera, this gentle cleansing bar delivers lightweight hydration while helping to calm the skin. Especially suited for sensitive, dry, irritated, or sun-exposed skin, it leaves the complexion feeling refreshed and comfortably hydrated.",
      "ingredients": [],
      "benefits": [
        "Calms inflammation, redness, and rashes",
        "Provides soothing hydration without greasiness",
        "Helps heal minor cuts or post-waxing irritation",
        "Great for sensitive skin or after-sun care"
      ],
      "usage": "Wet the bar, lather between wet hands, and massage onto skin. Rinse thoroughly with water."
    },
    "ar": {
      "name": "صابون الألوفيرا والخيار",
      "tagline": "تنظيف لطيف مع ترطيب مهدئ للبشرة الحساسة.",
      "description": "غني بالألوفيرا المهدئة، يوفر هذا القالب المنظّف اللطيف ترطيبًا خفيفًا مع المساعدة على تهدئة البشرة. مناسب بشكل خاص للبشرة الحساسة أو الجافة أو المتهيجة أو المعرضة للشمس، تاركًا البشرة منتعشة ورطبة بشكل مريح.",
      "ingredients": [],
      "benefits": [
        "يهدئ الالتهاب والاحمرار والطفح الجلدي",
        "يوفر ترطيبًا مهدئًا دون دهنية",
        "يساعد على التئام الجروح البسيطة أو تهيج ما بعد إزالة الشعر",
        "رائع للبشرة الحساسة أو العناية بعد التعرض للشمس"
      ],
      "usage": "بلّلي القالب ورغّيه بين يدين مبلّلتين، ثم دلّكي به البشرة واشطفيه جيدًا بالماء."
    }
  },
  {
    "id": "charcoal-tea-tree-soap",
    "category": "soaps",
    "price": 1500,
    "oldPrice": null,
    "badge": null,
    "images": 1,
    "spin": false,
    "size": "100 g",
    "en": {
      "name": "Charcoal Soap",
      "tagline": "Deep-cleansing charcoal bar for oily, acne-prone skin.",
      "description": "Powered by activated charcoal, this deeply cleansing bar helps draw away dirt, excess oil, and environmental impurities. Designed for oily, combination, and acne prone skin, it leaves the complexion feeling purified, fresh, and balanced.",
      "ingredients": [],
      "benefits": [
        "Removes dirt, oil, and environmental pollutants",
        "Reduces blackheads and unclogs pores",
        "Balances oily and combination skin",
        "Ideal for oily or acne-prone skin types"
      ],
      "usage": "Wet the bar, lather between wet hands, and massage onto skin. Rinse thoroughly with water."
    },
    "ar": {
      "name": "صابون الفحم",
      "tagline": "قالب تنظيف عميق بالفحم المنشط للبشرة الدهنية.",
      "description": "مدعوم بالفحم المنشط، يساعد هذا القالب المنظّف بعمق على سحب الأوساخ والزيوت الزائدة وشوائب البيئة. مصمّم للبشرة الدهنية والمختلطة والمعرضة لحب الشباب، تاركًا البشرة نقية ومنعشة ومتوازنة.",
      "ingredients": [],
      "benefits": [
        "يزيل الأوساخ والزيوت والملوثات البيئية",
        "يقلل الرؤوس السوداء وينظف المسام المسدودة",
        "يوازن البشرة الدهنية والمختلطة",
        "مثالي لأنواع البشرة الدهنية أو المعرضة لحب الشباب"
      ],
      "usage": "بلّلي القالب ورغّيه بين يدين مبلّلتين، ثم دلّكي به البشرة واشطفيه جيدًا بالماء."
    }
  },
  {
    "id": "goat-milk-tea-tree-soap",
    "category": "soaps",
    "price": 1500,
    "oldPrice": null,
    "badge": null,
    "images": 1,
    "spin": false,
    "size": "100 g",
    "en": {
      "name": "Goat Milk & Tea Tree Soap",
      "tagline": "Creamy goat milk meets purifying tea tree.",
      "description": "Blending the creamy nourishment of goat milk with the purifying properties of tea tree, this balancing bar gently cleanses while supporting healthy looking skin.",
      "ingredients": [],
      "benefits": [
        "Deeply moisturizes dry, sensitive, or irritated skin",
        "Helps fight acne, inflammation, and clogged pores",
        "Soothes eczema, redness, and itchiness",
        "Maintains skin's pH while gently cleansing",
        "Suitable for both face and body"
      ],
      "usage": "Wet the bar, lather between wet hands, and massage onto skin. Rinse thoroughly with water."
    },
    "ar": {
      "name": "صابون حليب الماعز وشجرة الشاي",
      "tagline": "حليب الماعز الكريمي يلتقي بنقاء شجرة الشاي.",
      "description": "يمزج هذا القالب المتوازن بين تغذية حليب الماعز الكريمية وخصائص شجرة الشاي المنقية، لينظّف البشرة بلطف مع دعم مظهرها الصحي.",
      "ingredients": [],
      "benefits": [
        "يرطّب بعمق البشرة الجافة أو الحساسة أو المتهيجة",
        "يساعد على مكافحة حب الشباب والالتهاب والمسام المسدودة",
        "يهدئ الإكزيما والاحمرار والحكة",
        "يحافظ على توازن درجة حموضة البشرة مع تنظيف لطيف",
        "مناسب للوجه والجسم معًا"
      ],
      "usage": "بلّلي القالب ورغّيه بين يدين مبلّلتين، ثم دلّكي به البشرة واشطفيه جيدًا بالماء."
    }
  },
  {
    "id": "honey-oats-soap",
    "category": "soaps",
    "price": 1500,
    "oldPrice": null,
    "badge": "new",
    "images": 1,
    "spin": false,
    "size": "100 g",
    "en": {
      "name": "Honey & Oats Soap",
      "tagline": "Gentle exfoliation with honey and milled oats.",
      "description": "A comforting blend of honey and finely milled oats, this nourishing bar gently cleanses while providing mild exfoliation. Ideal for dry, sensitive, and dehydrated skin, it helps replenish moisture while leaving the skin soft, smooth, and comforted.",
      "ingredients": [],
      "benefits": [
        "Gently removes dead skin cells without stripping moisture",
        "Deeply hydrates and soothes irritated or flaky skin",
        "Natural antibacterial properties help cleanse pores",
        "Suitable for daily face and body use"
      ],
      "usage": "For external use only."
    },
    "ar": {
      "name": "صابون العسل والشوفان",
      "tagline": "تقشير لطيف بالعسل والشوفان المطحون.",
      "description": "مزيج مريح من العسل والشوفان المطحون ناعمًا، ينظّف هذا القالب المغذّي البشرة بلطف مع تقشير خفيف. مثالي للبشرة الجافة والحساسة والمجففة، يساعد على استعادة الرطوبة تاركًا البشرة ناعمة وملساء ومريحة.",
      "ingredients": [],
      "benefits": [
        "يزيل خلايا الجلد الميتة بلطف دون سلب الرطوبة",
        "يرطّب ويهدئ بعمق البشرة المتهيجة أو المتقشرة",
        "خصائصه الطبيعية المضادة للبكتيريا تساعد على تنظيف المسام",
        "مناسب للاستخدام اليومي للوجه والجسم"
      ],
      "usage": "للاستخدام الخارجي فقط."
    }
  },
  {
    "id": "turmeric-neem-soap",
    "category": "soaps",
    "price": 1500,
    "oldPrice": null,
    "badge": null,
    "images": 1,
    "spin": false,
    "size": "100 g",
    "en": {
      "name": "Turmeric & Neem Soap",
      "tagline": "Handcrafted turmeric and neem bar for balanced skin.",
      "description": "A handcrafted, unisex Turmeric & Neem Soap.",
      "ingredients": [],
      "benefits": [
        "Removes dirt, oil, and environmental pollutants",
        "Reduces blackheads and unclogs pores",
        "Balances oily and combination skin",
        "Ideal for oily or acne-prone skin types"
      ],
      "usage": "Wet the bar, lather between wet hands, and massage onto skin. Rinse thoroughly with water."
    },
    "ar": {
      "name": "صابون الكركم والنيم",
      "tagline": "قالب يدوي الصنع من الكركم والنيم لبشرة متوازنة.",
      "description": "صابون الكركم والنيم، قالب يدوي الصنع مناسب لجميع الأجناس.",
      "ingredients": [],
      "benefits": [
        "يزيل الأوساخ والزيوت والملوثات البيئية",
        "يقلل الرؤوس السوداء وينظف المسام المسدودة",
        "يوازن البشرة الدهنية والمختلطة",
        "مثالي لأنواع البشرة الدهنية أو المعرضة لحب الشباب"
      ],
      "usage": "بلّلي القالب ورغّيه بين يدين مبلّلتين، ثم دلّكي به البشرة واشطفيه جيدًا بالماء."
    }
  }
];
