const express = require("express");

const router = express.Router();

const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(
  /\/$/,
  "",
);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
const REQUEST_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 45000);

function normalizeText(value = "") {
  return String(value).toLowerCase().trim();
}

function isMeaningfulString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function extractBudget(message) {
  const text = normalizeText(message);

  const numericMatch = text.match(
    /(?:budget|around|up to|under|max|maximum|le budget est|j'ai|my budget|budget is|for)\s*(?:is)?\s*(?:around|de)?\s*(\d+(?:\.\d+)?)\s*(?:tnd|dt|dinar|dinars|usd|\$)?/i,
  );
  if (numericMatch) {
    return { numeric: parseFloat(numericMatch[1]), level: null };
  }

  const simpleNum = text.match(/^(\d+(?:\.\d+)?)\s*(?:tnd|dt|dinar|dinars)?$/i);
  if (simpleNum) {
    return { numeric: parseFloat(simpleNum[1]), level: null };
  }

  if (
    /(cheap|budget|affordable|low price|not expensive|inexpensive|pas cher|economical)/i.test(
      text,
    )
  ) {
    return { level: 1, numeric: null };
  }

  if (/(mid|moderate|medium budget|reasonable|not too expensive)/i.test(text)) {
    return { level: 2, numeric: null };
  }

  if (
    /(luxury|fancy|expensive|fine dining|high end|romantic dinner)/i.test(text)
  ) {
    return { level: 3, numeric: null };
  }

  return { numeric: null, level: null };
}

function extractMaxDistance(message) {
  const text = normalizeText(message);

  const kmMatch = text.match(/(\d+(?:\.\d+)?)\s*km/i);
  if (kmMatch) return Number(kmMatch[1]);

  if (/(near me|nearby|close|closest|walking distance|not far)/i.test(text)) {
    return 3;
  }

  return null;
}

function detectCuisinePreferences(message) {
  const text = normalizeText(message);

  const keywords = {
    tunisian: [
      "tunisian",
      "traditional",
      "couscous",
      "ojja",
      "brik",
      "lablabi",
      "kafteji",
      "makroudh",
      "loukouma",
      "halwa",
      "pastilla",
    ],
    seafood: ["seafood", "fish", "shrimp", "calamari", "octopus", "salmon", "tuna", "lobster", "mussels"],
    italian: ["italian", "pizza", "pasta", "risotto", "lasagna", "fettuccine", "ravioli", "gnocchi"],
    fastfood: ["burger", "fast food", "sandwich", "fries", "tacos", "wrap", "hotdog", "kebab", "shawarma"],
    japanese: ["japanese", "sushi", "maki", "ramen", "udon", "tempura", "tonkatsu"],
    asian: ["asian", "noodles", "wok", "rice", "thai", "chinese", "vietnamese", "korean", "indian"],
    cafe: ["cafe", "coffee", "brunch", "cappuccino", "latte", "espresso"],
    grill: ["grill", "bbq", "barbecue", "meat", "steak", "lamb", "chicken", "ribs"],
    international: ["international", "romantic", "date night", "upscale", "fusion"],
    sweets: [
      "sweets",
      "sweet",
      "dessert",
      "desserts",
      "cake",
      "cakes",
      "pastry",
      "pastries",
      "chocolate",
      "candy",
      "ice cream",
      "gelato",
      "donut",
      "donuts",
      "brownie",
      "cheesecake",
      "pudding",
      "tiramisu",
      "crepe",
      "crepes",
      "waffle",
      "waffles",
      "pancake",
      "pancakes",
      "muffin",
      "muffins",
      "cookie",
      "cookies",
      "biscuit",
      "biscuits",
      "tartlet",
      "tartlets",
      "eclair",
      "eclairs",
      "macaron",
      "macarons",
      "mousse",
      "flan",
      "tart",
      "pie",
      "slice",
      "scoop",
      "truffle",
      "truffles",
      "soft serve",
      "frozen yogurt",
      "froyo",
      "fondant",
      "meringue",
      "profiterole",
      "canele",
      "croissant",
      "pain au chocolat",
      "choux",
      "baba au rhum",
      "croquembouche",
      "panna cotta",
      "ramekin",
      "carrot cake",
      "red velvet",
      "black forest",
      "victoria sponge",
      "lamington",
      "pavlova",
      "betty",
      "sundae",
      "partait",
      "granita",
      "sorbetnutella",
      "nutella",
      "ferrero",
      "kinder",
      "lindt",
      "godiva",
      "maltesers",
      "snickers",
      "twix",
      "mars",
      "bounty",
      "lindt",
      "lindor",
      "raffaello",
      "salter",
      "haribo",
      "oreo",
      "nutty",
      "nutty-flavored",
      "hazelnut",
      "almond",
      "pistachio",
      "walnut",
      "pecan",
      "sesame",
      "honey",
      "caramel",
      "toffee",
      "butterscotch",
    ],
    drinks: [
      "drink",
      "drinks",
      "juice",
      "juices",
      "smoothie",
      "smoothies",
      "milkshake",
      "shake",
      "shakes",
      "coffee",
      "tea",
      "latte",
      "cappuccino",
      "espresso",
      "americano",
      "mocha",
      "flat white",
      "macchiato",
      "cortado",
      "affogato",
      "iced coffee",
      "cold brew",
      "cold coffee",
      "frappuccino",
      "frappe",
      "float",
      "soda",
      "soft drink",
      "cola",
      "fanta",
      "sprite",
      "lemonade",
      "limeade",
      "orange juice",
      "apple juice",
      "mango juice",
      "pineapple juice",
      "carrot juice",
      "beetroot juice",
      "cranberry juice",
      "pomegranate juice",
      "watermelon juice",
      "fresh juice",
      "detox juice",
      "green juice",
      "protein shake",
      "whey shake",
      "banana milkshake",
      "chocolate milkshake",
      "strawberry shake",
      "vanilla shake",
      "smoothie bowl",
      "açai bowl",
      "matcha",
      "matcha latte",
      "boba",
      "bubble tea",
      "milk tea",
      "thai tea",
      "iced tea",
      "green tea",
      "black tea",
      "herbal tea",
      "chamomile",
      "mint tea",
      "lemongrass tea",
      "kombucha",
      "coconut water",
      "aloe vera drink",
      "horchata",
      "lassi",
      "mango lassi",
      "iced lassi",
      "fresh lemonade",
      "virgin mojito",
      "mint lemonade",
      "hibiscus drink",
      "tamarind drink",
      "ginger drink",
      "turmeric drink",
      "golden milk",
      "smoothie",
      "protein smoothie",
      "acai smoothie",
      "berry smoothie",
      "tropical smoothie",
      "green smoothie",
      "kale smoothie",
      "spinach smoothie",
      "avocado smoothie",
      "peanut butter smoothie",
      "almond smoothie",
      "oat drink",
      "almond milk",
      "oat milk",
      "soy milk",
      "rice milk",
      "coconut milk",
      "cashew milk",
    ],
  };

  return Object.entries(keywords)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([category]) => category);
}

function detectMoodTags(message) {
  const text = normalizeText(message);
  const moods = [];

  if (/(romantic|date|couple)/i.test(text)) moods.push("Romantic");
  if (/(family|kids|children)/i.test(text)) moods.push("Family Friendly");
  if (/(late night|night|open late)/i.test(text)) moods.push("Late Night");
  if (/(traditional|authentic|local)/i.test(text)) moods.push("Traditional");
  if (/(coffee|brunch)/i.test(text)) moods.push("Coffee", "Brunch");
  if (/(cozy|calm|quiet)/i.test(text)) moods.push("Cozy");
  if (/(quick|fast|grab and go)/i.test(text)) moods.push("Quick Bite");

  return [...new Set(moods)];
}

function isRecommendationRequest(message = "") {
  return /(restaurant|food|dish|meal|eat|hungry|recommend|suggest|where should i eat|what should i eat|near me|nearby|budget|pizza|burger|couscous|sushi|pasta|seafood|grill|dinner|lunch|breakfast|brunch|sweet|dessert|cake|candy|chocolate|drink|juice|coffee|tea|smoothie|milkshake|crepe|nutella|kinder|waffle|cookie)/i.test(
    message,
  );
}

function isDescriptionRequest(message = "") {
  return /^(write|generate|create|describe|give me a description for|write a description for|write an? (?:appetizing|short|polished|delightful)?.*description)/i.test(
    message,
  );
}

function isFullMenuRequest(message = "") {
  return /(all menu|show.*all|full menu|complete menu|everything|all dishes|all items|what do you have|menu please)/i.test(
    message,
  );
}

function isNewItemRequest(message = "") {
  return /(what.*new|new item|new dish|new menu|latest|recent|just added|fresh|new arrival|what else|what's new)/i.test(
    message,
  );
}

function getNewItems(restaurants = [], daysOld = 7) {
  const newItems = [];
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  for (const restaurant of restaurants) {
    if (!Array.isArray(restaurant.menu)) continue;

    for (const item of restaurant.menu) {
      const itemDate = new Date(item.createdAt || 0);
      if (itemDate >= cutoffDate) {
        newItems.push({
          name: item.name,
          price: item.price,
          image: item.image || null,
          description: item.description || "",
          restaurant: restaurant.name,
          restaurantId: restaurant._id,
          isNew: true,
        });
      }
    }
  }

  return newItems;
}

function filterMenuByBudget(menu = [], maxBudget) {
  if (!maxBudget || !Array.isArray(menu) || !menu.length) return menu;

  // Filter to only items within budget
  const withinBudget = menu.filter((item) => Number(item.price) <= maxBudget);

  // Sort by proximity to budget (closest to budget first)
  // This prioritizes dishes at the budget price, then cheaper alternatives
  return withinBudget.sort((a, b) => {
    const priceA = Number(a.price) || 0;
    const priceB = Number(b.price) || 0;

    // Distance from budget - dishes closest to budget come first
    const distA = Math.abs(maxBudget - priceA);
    const distB = Math.abs(maxBudget - priceB);

    return distA - distB;
  });
}

function averageMenuPrice(menu = []) {
  if (!Array.isArray(menu) || !menu.length) return null;
  const validPrices = menu
    .map((item) => Number(item.price))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!validPrices.length) return null;

  return (
    validPrices.reduce((sum, value) => sum + value, 0) / validPrices.length
  );
}

function scoreRestaurant(restaurant, prefs) {
  let score = 0;

  score += (Number(restaurant.rating) || 0) * 10;
  score -= (Number(restaurant.distanceKm) || 0) * 4;

  const avgPrice =
    averageMenuPrice(restaurant.menu) ||
    Number(restaurant.priceEstimateTnd) ||
    null;

  if (prefs.maxBudget?.numeric && avgPrice) {
    if (avgPrice <= prefs.maxBudget.numeric) score += 30;
    else if (avgPrice <= prefs.maxBudget.numeric * 1.25) score += 8;
    else score -= 40;
  } else if (prefs.maxBudget?.level) {
    const level = Number(restaurant.price) || 2;
    if (level <= prefs.maxBudget.level) score += 16;
    else score -= 20;
  }

  if (prefs.maxDistanceKm) {
    if ((Number(restaurant.distanceKm) || 999) <= prefs.maxDistanceKm)
      score += 18;
    else score -= 12;
  }

  if (
    prefs.categories.length &&
    prefs.categories.includes(normalizeText(restaurant.category))
  ) {
    score += 26;
  }

  const haystack = normalizeText(
    [
      restaurant.name,
      restaurant.category,
      restaurant.description,
      ...(restaurant.tags || []),
      ...(restaurant.menu || []).map((item) => item.name).join(" "),
    ].join(" "),
  );

  for (const category of prefs.categories) {
    if (haystack.includes(category)) score += 10;
  }

  for (const tag of prefs.moods) {
    if (haystack.includes(normalizeText(tag))) score += 10;
  }

  if (
    !prefs.categories.length &&
    !prefs.moods.length &&
    normalizeText(restaurant.category) === "tunisian"
  ) {
    score += 5;
  }

  return Math.round(score * 10) / 10;
}

function rankRestaurants(restaurants = [], message = "") {
  const prefs = {
    maxBudget: extractBudget(message),
    maxDistanceKm: extractMaxDistance(message),
    categories: detectCuisinePreferences(message),
    moods: detectMoodTags(message),
  };

  const ranked = restaurants
    .map((restaurant) => ({
      ...restaurant,
      score: scoreRestaurant(restaurant, prefs),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return { prefs, ranked };
}

function formatPriceTnd(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `${num.toFixed(0)} TND`;
}

function buildRestaurantSummary(restaurants = [], message = "") {
  const { prefs, ranked } = rankRestaurants(restaurants, message);
  const showFullMenu = isFullMenuRequest(message);

  const preferenceSummary = [
    prefs.categories.length
      ? `Preferred cuisines: ${prefs.categories.join(", ")}`
      : null,
    prefs.maxBudget?.numeric
      ? `Budget: ${prefs.maxBudget.numeric} TND max`
      : null,
    prefs.maxBudget?.level
      ? `Budget level: ${prefs.maxBudget.level} (1 cheap, 2 moderate, 3 premium)`
      : null,
    prefs.maxDistanceKm ? `Max distance: ${prefs.maxDistanceKm} km` : null,
    prefs.moods.length ? `Mood: ${prefs.moods.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const summary = ranked
    .map((restaurant, index) => {
      const filteredMenu = filterMenuByBudget(
        restaurant.menu || [],
        prefs.maxBudget?.numeric,
      );

      // Show all menu if user requested it, otherwise limit to 4 items
      const menuToShow = showFullMenu
        ? filteredMenu.length
          ? filteredMenu
          : Array.isArray(restaurant.menu)
            ? restaurant.menu
            : []
        : filteredMenu.length
          ? filteredMenu.slice(0, 4)
          : Array.isArray(restaurant.menu)
            ? restaurant.menu.slice(0, 4)
            : [];

      const dishes = menuToShow.length
        ? menuToShow
            .map((item) => {
              const price = formatPriceTnd(item.price);
              const isNew =
                item.createdAt &&
                new Date(item.createdAt) >=
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ? "🆕 "
                  : "";
              return price
                ? `${isNew}${item.name} (${price})`
                : `${isNew}${item.name}`;
            })
            .join(", ")
        : "No menu available";

      return [
        `${index + 1}. ${restaurant.name}`,
        `category: ${restaurant.category || "N/A"}`,
        `rating: ${restaurant.rating || "N/A"}`,
        `distance: ${restaurant.distance || restaurant.distanceKm || "N/A"}`,
        `address: ${restaurant.address || "N/A"}`,
        `tags: ${(restaurant.tags || []).join(", ") || "N/A"}`,
        `description: ${restaurant.description || "N/A"}`,
        `dishes: ${dishes}`,
      ].join(" | ");
    })
    .join("\n");

  return { prefs, ranked, preferenceSummary, summary };
}

function buildSystemPrompt(restaurants = [], message = "") {
  const { preferenceSummary, summary } = buildRestaurantSummary(
    restaurants,
    message,
  );
  const recommendationMode = isRecommendationRequest(message);
  const descriptionMode = isDescriptionRequest(message);
  const fullMenuMode = isFullMenuRequest(message);
  const newItemMode = isNewItemRequest(message);

  // Strict mode for description generation - no questions, no explanations
  if (descriptionMode) {
    return [
      "Generate ONLY a clean, concise description. No questions. No explanations. No extra text.",
      "Output: Description only. Nothing else.",
      "Keep it 1-3 sentences max.",
      "Make it appetizing and professional.",
    ].join("\n\n");
  }

  const baseInstructions = [
    "You are TasteAI, a warm and smart restaurant assistant inside TasteMatch.",
    "Talk like a real person: natural, helpful, friendly, and concise.",
    "Use only the restaurants and dishes provided below. Never invent restaurant names, dish names, prices, or addresses.",
  ];

  if (newItemMode) {
    baseInstructions.push(
      "The user is asking about NEW items! Look for dishes marked with 🆕 in the menu.",
      "Highlight NEW dishes and tell the user about them with excitement.",
      "Mention at least 2-4 new dishes with their restaurant name.",
      "Format: Restaurant Name • 🆕 New Dish Name (Price)",
    );
  } else if (fullMenuMode) {
    baseInstructions.push(
      "The user asked to see the FULL menu. List ALL dishes with names and prices organized clearly.",
    );
  } else {
    baseInstructions.push(
      "When recommending, explain your choice naturally in 2 to 5 short sentences.",
    );
  }

  if (recommendationMode || newItemMode) {
    return [
      ...baseInstructions,
      "When recommending, ALWAYS mention the specific dish names you suggest, not just the restaurant.",
      "Format: Restaurant Name • Dish Name (Price) - when mentioning specific recommendations.",
      "You may ask one short follow-up question if the user's request is too vague.",
      "If the user gave a budget (e.g., '15 TND'), prioritize recommending dishes AT or CLOSE TO that price, not just cheaper options.",
      "Always respect the budget maximum - never suggest anything over it.",
      "IMPORTANT - Mention multiple dishes based on what they asked:",
      "  - If they ask for a CUISINE or CATEGORY (e.g., 'asian food', 'desserts', 'pizza', 'drinks'): mention 3-6 specific dishes from different restaurants",
      "  - If they ask for BRANDS (e.g., 'nutella', 'kinder', 'salter'): find dishes with these brands and mention them",
      "  - If they ask for SPECIFIC ITEMS (e.g., 'nutella crepe', 'kinder cookies', 'matcha smoothie'): mention 2-4 options",
      "  - If they ask for NEW items: mention 2-4 new dishes (marked with 🆕) from different restaurants",
      "  - If they ask for HELP/MOOD (e.g., 'I'm hungry', 'something cozy'): mention 2-3 dishes",
      "  - Always mention different restaurants when possible to give variety",
      "Examples of good recommendations:",
      "- 'For Asian food, try: Restaurant A • Pad Thai (25 TND), Restaurant B • Spring Rolls (15 TND), Restaurant C • Mango Sticky Rice (18 TND)'",
      "- 'For sweets with brands: Dessert Place • Nutella Crepe (18 TND), Bakery Heaven • Kinder Surprise Cake (22 TND), Candy Shop • Ferrero Chocolate Box (15 TND)'",
      "- 'For drinks: Coffee Hub • Iced Matcha Latte (8 TND), Juice Bar • Fresh Mango Smoothie (12 TND), Tea House • Bubble Tea (10 TND)'",
      "- 'For new items: Sweet Haven • 🆕 Chocolate Lava Cake (22 TND) - just arrived! And Bakery Co • 🆕 Matcha Cheesecake (28 TND) - brand new!'",
      "- 'For pizza: Bella Italia • Margherita (22 TND) and Carbonara (24 TND)'",
      "You can sound human, like: 'If you want something cozy and not too expensive, I'd go with Restaurant Name • Dish Name'",
      "Do not sound robotic. Do not use rigid templates unless it helps clarity.",
      "If nothing fits, say so honestly and suggest how the user can refine the request.",
      preferenceSummary
        ? `User preferences: ${preferenceSummary}`
        : "No strong preferences detected yet.",
      summary
        ? `Available restaurants:\n${summary}`
        : "No restaurant data was provided.",
    ].join("\n\n");
  }

  return [
    "You are TasteAI, a friendly, natural, conversational AI assistant inside TasteMatch.",
    "Talk like a real person: warm, helpful, relaxed, and interactive.",
    "You can chat casually, answer food questions, suggest ideas, and guide the user.",
    "Do not sound robotic or overly formal.",
    "If the user asks about restaurants or dishes, only use the provided restaurant data and never invent names.",
    "When the user is just chatting, respond naturally and keep the conversation flowing.",
    "Ask at most one short follow-up question when it helps.",
    summary
      ? `Restaurant context you may use if relevant:\n${summary}`
      : "No restaurant data was provided.",
  ].join("\n\n");
}

function buildFallbackReply(restaurants = [], message = "") {
  const { prefs, ranked } = rankRestaurants(restaurants, message);

  if (!ranked.length) {
    return "I couldn't find a good match right now. Tell me your budget, preferred cuisine, or area, and I'll narrow it down.";
  }

  if (!isRecommendationRequest(message)) {
    return "I'm here with you. Tell me what you're craving, your budget, or whether you want something cozy, quick, or traditional, and I'll help you pick.";
  }

  const top = ranked.slice(0, 2);

  const lines = top.map((restaurant) => {
    const affordableDishes = filterMenuByBudget(
      restaurant.menu || [],
      prefs.maxBudget?.numeric,
    );

    const menuToUse = affordableDishes.length
      ? affordableDishes.slice(0, 2)
      : Array.isArray(restaurant.menu)
        ? restaurant.menu.slice(0, 2)
        : [];

    const dishText = menuToUse.length
      ? menuToUse
          .map((item) => {
            const price = formatPriceTnd(item.price);
            return price ? `${item.name} (${price})` : item.name;
          })
          .join(" or ")
      : "their menu";

    const reasons = [
      restaurant.rating ? `rated ${restaurant.rating}` : null,
      restaurant.distance ? `${restaurant.distance} away` : null,
      restaurant.category || null,
    ]
      .filter(Boolean)
      .join(", ");

    return `${restaurant.name} looks like a good fit${reasons ? ` — ${reasons}` : ""}. I'd check ${dishText}.`;
  });

  return lines.join(" ");
}

function extractRecommendedDishes(aiResponse, restaurants = []) {
  const recommendedDishes = [];
  const responseText = normalizeText(aiResponse);

  for (const restaurant of restaurants) {
    if (!Array.isArray(restaurant.menu)) continue;

    for (const dish of restaurant.menu) {
      const restaurantName = normalizeText(restaurant.name);
      const dishName = normalizeText(dish.name);

      if (!restaurantName || !dishName) continue;

      const mentionsRestaurant = responseText.includes(restaurantName);
      const mentionsDish = responseText.includes(dishName);

      if (mentionsRestaurant && mentionsDish) {
        const alreadyExists = recommendedDishes.find(
          (item) =>
            normalizeText(item.restaurant) === restaurantName &&
            normalizeText(item.name) === dishName,
        );

        if (!alreadyExists) {
          recommendedDishes.push({
            name: dish.name,
            price: dish.price,
            image: dish.image || null,
            description: dish.description || "",
            restaurant: restaurant.name,
            restaurantId: restaurant._id,
          });
        }
      }
    }
  }

  return recommendedDishes;
}

router.post("/chat", async (req, res) => {
  const { message, restaurants = [], history = [] } = req.body || {};

  if (!isMeaningfulString(message)) {
    return res.status(400).json({ message: "message is required" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const messages = [
      { role: "system", content: buildSystemPrompt(restaurants, message) },
      ...history
        .filter(
          (item) =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            isMeaningfulString(item.content),
        )
        .slice(-10),
      { role: "user", content: message },
    ];

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.05,
        },
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(502).json({
        message: data?.error || "Failed to get a response from Ollama",
        fallbackReply: buildFallbackReply(restaurants, message),
      });
    }

    const reply = data?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        message: "Ollama returned an empty response",
        fallbackReply: buildFallbackReply(restaurants, message),
      });
    }

    const recommendedDishes = extractRecommendedDishes(reply, restaurants);
    const rankedRestaurants = rankRestaurants(restaurants, message).ranked;

    // If user asks about new items, include them in the response
    let dishesToReturn = recommendedDishes;
    if (isNewItemRequest(message)) {
      const newItems = getNewItems(restaurants, 7);
      // Combine new items with recommended dishes, avoiding duplicates
      const combinedDishes = [...newItems];
      for (const dish of recommendedDishes) {
        if (
          !combinedDishes.find(
            (d) =>
              normalizeText(d.name) === normalizeText(dish.name) &&
              normalizeText(d.restaurant) === normalizeText(dish.restaurant),
          )
        ) {
          combinedDishes.push(dish);
        }
      }
      dishesToReturn = combinedDishes.slice(0, 10); // Limit to 10 items
    }

    return res.json({
      reply,
      model: OLLAMA_MODEL,
      recommendations: rankedRestaurants.slice(0, 3),
      dishes: dishesToReturn,
    });
  } catch (error) {
    const messageText =
      error.name === "AbortError"
        ? "Ollama request timed out"
        : error.message || "Failed to contact Ollama";

    return res.status(500).json({
      message: messageText,
      fallbackReply: buildFallbackReply(restaurants, message),
    });
  } finally {
    clearTimeout(timeout);
  }
});

router.post("/unsplash", async (req, res) => {
  const { query } = req.body || {};

  if (!isMeaningfulString(query)) {
    return res.status(400).json({ message: "query is required" });
  }

  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      return res.status(400).json({
        message:
          "Unsplash API key not configured. Please set UNSPLASH_ACCESS_KEY in .env",
        fallback: true,
      });
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&order_by=relevant`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        message:
          data?.errors?.[0] ||
          "Failed to fetch from Unsplash. Check your API key.",
      });
    }

    const images = (data.results || []).map((img) => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.thumb,
      alt: img.alt_description || "Food image",
      photographer: img.user?.name || "",
      photographerUrl: img.user?.portfolio_url || "",
    }));

    return res.json({ images });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to fetch images from Unsplash",
    });
  }
});

module.exports = router;
