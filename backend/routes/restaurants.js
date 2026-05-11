const express = require("express");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const { protect, optionalProtect } = require("../middleware/auth");

const router = express.Router();

function ensureRestaurantRole(req, res, next) {
  if (req.user?.role !== "restaurant") {
    return res
      .status(403)
      .json({ message: "Only restaurant users can access this endpoint" });
  }
  next();
}

function sanitizePayload(req, ownerId) {
  const {
    name,
    description,
    address,
    phone,
    category,
    menu = [],
    image = "",
    tags = [],
    price = 2,
    lat = null,
    lng = null,
  } = req.body;

  const sanitizedMenu = Array.isArray(menu)
    ? menu
        .filter((item) => item && item.name && item.price !== undefined)
        .map((item) => ({
          name: String(item.name).trim(),
          description: item.description ? String(item.description).trim() : "",
          price: Number(item.price),
          image: item.image ? String(item.image) : "",
        }))
        .filter(
          (item) => item.name && !Number.isNaN(item.price) && item.price >= 0,
        )
    : [];

  const sanitizedTags = Array.isArray(tags)
    ? tags.map((tag) => String(tag).trim()).filter((tag) => tag.length > 0)
    : [];

  return {
    owner: ownerId,
    name: String(name || "").trim(),
    description: String(description || "").trim(),
    address: String(address || "").trim(),
    phone: String(phone || "").trim(),
    category: String(category || "").trim(),
    image: String(image || ""),
    tags: sanitizedTags,
    price: Math.max(1, Math.min(3, Number(price) || 2)),
    lat: lat !== null && lat !== undefined ? Number(lat) : null,
    lng: lng !== null && lng !== undefined ? Number(lng) : null,
    menu: sanitizedMenu,
  };
}

function buildOrderFromItems(restaurant, rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "Order items are required" };
  }

  const items = [];
  let subtotalAmount = 0;
  let totalQuantity = 0;

  for (const rawItem of rawItems) {
    const dishName = String(rawItem?.dishName || "").trim();
    const quantity = Number(rawItem?.quantity);

    if (!dishName || !Number.isFinite(quantity) || quantity < 1) {
      return { error: "Each order item must include a valid dish and quantity" };
    }

    const menuItem = restaurant.menu.find((item) => item.name === dishName);
    if (!menuItem) {
      return { error: `Dish "${dishName}" was not found in this restaurant menu` };
    }

    const unitPrice = Number(menuItem.price) || 0;
    items.push({
      dishName: menuItem.name,
      quantity,
      unitPrice,
    });
    subtotalAmount += unitPrice * quantity;
    totalQuantity += quantity;
  }

  return { items, subtotalAmount, totalQuantity };
}

function getQuantityDiscountRate(totalQuantity) {
  if (totalQuantity >= 6) return 0.12;
  if (totalQuantity >= 4) return 0.08;
  if (totalQuantity >= 2) return 0.05;
  return 0;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getOrdersUntilNextCoupon(completedOrders = 0) {
  const remainder = completedOrders % 10;
  return remainder === 0 ? 10 : 10 - remainder;
}

function getLoyaltyEntry(user, restaurantId) {
  if (!user?.loyalty) return null;
  return (
    user.loyalty.find(
      (entry) => String(entry.restaurant) === String(restaurantId),
    ) || null
  );
}

function getEffectiveRating(restaurant) {
  const ratings = Array.isArray(restaurant.ratings) ? restaurant.ratings : [];
  if (!ratings.length) return Number(restaurant.rating) || 4.5;

  const average =
    ratings.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0) /
    ratings.length;

  return Math.round(average * 10) / 10;
}

function hasCompletedOrder(user, restaurant) {
  if (!user || !restaurant) return false;

  const loyaltyEntry = getLoyaltyEntry(user, restaurant._id);
  if ((loyaltyEntry?.completedOrders || 0) > 0) return true;

  const userNames = [
    user.fullName,
    user.name,
    user.email,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return (restaurant.orders || []).some(
    (order) =>
      order.status !== "cancelled" &&
      (String(order.customer || "") === String(user._id) ||
        userNames.includes(String(order.customerName || "").trim().toLowerCase())),
  );
}

function getEstimatedReadyAt(createdAt = new Date(), totalQuantity = 1) {
  const baseMinutes = 20;
  const extraMinutes = Math.min(25, Math.max(0, Number(totalQuantity) - 1) * 4);
  return new Date(new Date(createdAt).getTime() + (baseMinutes + extraMinutes) * 60000);
}

function getOrderReadyInfo(order) {
  const readyAt = order.estimatedReadyAt || getEstimatedReadyAt(
    order.createdAt,
    (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
  );
  const minutesRemaining = Math.max(
    0,
    Math.ceil((new Date(readyAt).getTime() - Date.now()) / 60000),
  );

  return {
    estimatedReadyAt: readyAt,
    minutesRemaining,
    readyLabel:
      order.status === "cancelled"
        ? "Cancelled"
        : minutesRemaining > 0
          ? `${minutesRemaining} min`
          : "Ready now",
  };
}

function normalizeClientOrder(restaurant, order) {
  const ready = getOrderReadyInfo(order);

  return {
    _id: order._id,
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    restaurantImage: restaurant.image || "",
    status: order.status,
    items: order.items || [],
    subtotalAmount: order.subtotalAmount || 0,
    discountAmount: order.discountAmount || 0,
    totalAmount: order.totalAmount || 0,
    discountSummary: order.discountSummary || "",
    couponApplied: Boolean(order.couponApplied),
    createdAt: order.createdAt,
    canCancel: order.status !== "cancelled" && ready.minutesRemaining > 0,
    ...ready,
  };
}

function normalizeRestaurant(restaurant, user = null) {
  const data = restaurant.toObject ? restaurant.toObject() : restaurant;
  const userRating =
    user && Array.isArray(data.ratings)
      ? data.ratings.find((entry) => String(entry.user) === String(user._id))
      : null;

  return {
    ...data,
    price: data.price || 2,
    rating: getEffectiveRating(data),
    ratingCount: Array.isArray(data.ratings) ? data.ratings.length : 0,
    userRating: userRating?.value || null,
    canRate: hasCompletedOrder(user, data),
    lat: data.lat || null,
    lng: data.lng || null,
    tags: data.tags || [],
  };
}

function buildDiscountSummary({
  quantityRate,
  multiRestaurantRate,
  couponApplied,
}) {
  if (couponApplied) return "Free order coupon applied";

  const labels = [];
  if (quantityRate > 0) {
    labels.push(`${Math.round(quantityRate * 100)}% quantity discount`);
  }
  if (multiRestaurantRate > 0) {
    labels.push(`${Math.round(multiRestaurantRate * 100)}% multi-restaurant bonus`);
  }

  return labels.join(" + ");
}

function buildPricingPreview(restaurants, rawItems = [], user = null, couponRestaurantIds = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "Basket items are required" };
  }

  const groupsMap = new Map();

  for (const rawItem of rawItems) {
    const restaurantId = String(rawItem?.restaurantId || "").trim();
    const dishName = String(rawItem?.dishName || "").trim();
    const quantity = Number(rawItem?.quantity);

    if (!restaurantId || !dishName || !Number.isFinite(quantity) || quantity < 1) {
      return { error: "Each basket item must include restaurantId, dishName, and quantity" };
    }

    if (!groupsMap.has(restaurantId)) {
      groupsMap.set(restaurantId, []);
    }

    groupsMap.get(restaurantId).push({ dishName, quantity });
  }

  const restaurantIds = [...groupsMap.keys()];
  if (restaurantIds.length !== restaurants.length) {
    return { error: "One or more restaurants were not found" };
  }

  const ownerIds = [...new Set(restaurants.map((restaurant) => String(restaurant.owner)))];
  let multiRestaurantRate = 0;

  if (restaurantIds.length > 1) {
    multiRestaurantRate = ownerIds.length === 1 ? 0.03 : 0.05;
  }

  const couponIdSet = new Set((couponRestaurantIds || []).map((id) => String(id)));
  const groups = [];
  let subtotalAmount = 0;
  let totalDiscountAmount = 0;
  let totalAmount = 0;

  for (const restaurant of restaurants) {
    const restaurantId = String(restaurant._id);
    const builtOrder = buildOrderFromItems(restaurant, groupsMap.get(restaurantId));
    if (builtOrder.error) {
      return { error: builtOrder.error };
    }

    const loyaltyEntry = getLoyaltyEntry(user, restaurantId);
    const availableCoupons = loyaltyEntry?.availableFreeOrders || 0;
    const couponEligible = availableCoupons > 0;
    const couponApplied = couponEligible && couponIdSet.has(restaurantId);
    const quantityRate = getQuantityDiscountRate(builtOrder.totalQuantity);
    const discountRate = couponApplied
      ? 1
      : Math.min(0.95, quantityRate + multiRestaurantRate);
    const discountAmount = roundMoney(builtOrder.subtotalAmount * discountRate);
    const finalAmount = couponApplied
      ? 0
      : roundMoney(builtOrder.subtotalAmount - discountAmount);

    subtotalAmount += builtOrder.subtotalAmount;
    totalDiscountAmount += discountAmount;
    totalAmount += finalAmount;

    groups.push({
      restaurantId,
      restaurantName: restaurant.name,
      ownerId: String(restaurant.owner),
      items: builtOrder.items,
      totalQuantity: builtOrder.totalQuantity,
      subtotalAmount: roundMoney(builtOrder.subtotalAmount),
      discountRate,
      discountAmount,
      totalAmount: finalAmount,
      quantityRate,
      multiRestaurantRate,
      couponEligible,
      availableCoupons,
      couponApplied,
      completedOrders: loyaltyEntry?.completedOrders || 0,
      ordersUntilNextCoupon: getOrdersUntilNextCoupon(
        loyaltyEntry?.completedOrders || 0,
      ),
      discountSummary: buildDiscountSummary({
        quantityRate,
        multiRestaurantRate,
        couponApplied,
      }),
    });
  }

  return {
    groups,
    subtotalAmount: roundMoney(subtotalAmount),
    totalDiscountAmount: roundMoney(totalDiscountAmount),
    totalAmount: roundMoney(totalAmount),
    multiRestaurantRate,
  };
}

async function applyLoyaltyRewards(userId, groups) {
  if (!userId || !Array.isArray(groups) || groups.length === 0) return null;

  const user = await User.findById(userId);
  if (!user) return null;

  groups.forEach((group) => {
    const restaurantId = String(group.restaurantId);
    let entry = user.loyalty.find(
      (item) => String(item.restaurant) === restaurantId,
    );

    if (!entry) {
      entry = {
        restaurant: group.restaurantId,
        completedOrders: 0,
        availableFreeOrders: 0,
      };
      user.loyalty.push(entry);
      entry = user.loyalty[user.loyalty.length - 1];
    }

    if (group.couponApplied && entry.availableFreeOrders > 0) {
      entry.availableFreeOrders -= 1;
    }

    entry.completedOrders += 1;

    if (entry.completedOrders % 10 === 0) {
      entry.availableFreeOrders += 1;
    }
  });

  await user.save();
  return user;
}

// PUBLIC: Get all restaurants
router.get("/", optionalProtect, async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    const user =
      req.user?.role === "client" ? await User.findById(req.user.id) : null;
    const normalized = restaurants.map((r) => normalizeRestaurant(r, user));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/mine", protect, ensureRestaurantRole, async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });
    const normalized = restaurants.map((r) => normalizeRestaurant(r));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/orders/mine", protect, async (req, res) => {
  if (req.user?.role !== "client") {
    return res.status(403).json({ message: "Only clients can view their orders" });
  }

  try {
    const restaurants = await Restaurant.find({
      "orders.customer": req.user.id,
    }).sort({ updatedAt: -1 });

    const orders = restaurants
      .flatMap((restaurant) =>
        restaurant.orders
          .filter((order) => String(order.customer || "") === String(req.user.id))
          .map((order) => normalizeClientOrder(restaurant, order)),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/orders/:orderId/cancel", protect, async (req, res) => {
  if (req.user?.role !== "client") {
    return res.status(403).json({ message: "Only clients can cancel their orders" });
  }

  try {
    const restaurant = await Restaurant.findOne({
      "orders._id": req.params.orderId,
      "orders.customer": req.user.id,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = restaurant.orders.id(req.params.orderId);
    if (!order || String(order.customer || "") !== String(req.user.id)) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "cancelled") {
      return res.json(normalizeClientOrder(restaurant, order));
    }

    const ready = getOrderReadyInfo(order);
    if (ready.minutesRemaining <= 0) {
      return res.status(400).json({ message: "This order is already ready and cannot be cancelled" });
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();

    const user = await User.findById(req.user.id);
    const loyaltyEntry = getLoyaltyEntry(user, restaurant._id);
    if (loyaltyEntry && loyaltyEntry.completedOrders > 0) {
      loyaltyEntry.completedOrders -= 1;
      await user.save();
    }

    await restaurant.save();

    res.json(normalizeClientOrder(restaurant, order));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, ensureRestaurantRole, async (req, res) => {
  const payload = sanitizePayload(req, req.user.id);

  if (
    !payload.name ||
    !payload.description ||
    !payload.address ||
    !payload.phone ||
    !payload.category
  ) {
    return res
      .status(400)
      .json({ message: "All basic restaurant fields are required" });
  }

  try {
    const restaurant = await Restaurant.create(payload);
    res.status(201).json(normalizeRestaurant(restaurant));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, ensureRestaurantRole, async (req, res) => {
  const payload = sanitizePayload(req, req.user.id);

  if (
    !payload.name ||
    !payload.description ||
    !payload.address ||
    !payload.phone ||
    !payload.category
  ) {
    return res
      .status(400)
      .json({ message: "All basic restaurant fields are required" });
  }

  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      payload,
      { new: true, runValidators: true },
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(normalizeRestaurant(restaurant));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, ensureRestaurantRole, async (req, res) => {
  try {
    const deleted = await Restaurant.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json({ message: "Restaurant deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/rating", protect, async (req, res) => {
  if (req.user?.role !== "client") {
    return res
      .status(403)
      .json({ message: "Only clients can rate restaurants" });
  }

  const value = Number(req.body.rating);
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return res.status(400).json({ message: "Rating must be from 1 to 5" });
  }

  try {
    const [restaurant, user] = await Promise.all([
      Restaurant.findById(req.params.id),
      User.findById(req.user.id),
    ]);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (!user || !hasCompletedOrder(user, restaurant)) {
      return res.status(403).json({
        message: "You can rate this restaurant after placing at least one order",
      });
    }

    const existing = restaurant.ratings.find(
      (entry) => String(entry.user) === String(user._id),
    );

    if (existing) {
      existing.value = value;
      existing.updatedAt = new Date();
    } else {
      restaurant.ratings.push({
        user: user._id,
        value,
        updatedAt: new Date(),
      });
    }

    restaurant.rating = getEffectiveRating(restaurant);
    await restaurant.save();

    res.json(normalizeRestaurant(restaurant, user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/view", async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewsCount: 1 } },
      { new: true },
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json({ viewsCount: restaurant.viewsCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/orders", optionalProtect, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const customerName = String(req.body.customerName || "").trim() || "Guest";
    const status =
      req.body.status === "pending" || req.body.status === "cancelled"
        ? req.body.status
        : "paid";

    const builtOrder = buildOrderFromItems(restaurant, req.body.items);
    if (builtOrder.error) {
      return res.status(400).json({ message: builtOrder.error });
    }

    const subtotalAmount = roundMoney(builtOrder.subtotalAmount);
    const order = {
      customer: req.user?.role === "client" ? req.user.id : null,
      customerName,
      status,
      items: builtOrder.items,
      subtotalAmount,
      discountAmount: 0,
      totalAmount: subtotalAmount,
      discountSummary: "",
      couponApplied: false,
      estimatedReadyAt: getEstimatedReadyAt(new Date(), builtOrder.totalQuantity),
      createdAt: new Date(),
    };

    restaurant.orders.push(order);
    await restaurant.save();

    const createdOrder = restaurant.orders[restaurant.orders.length - 1];

    res.status(201).json({
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/checkout/preview", optionalProtect, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const restaurantIds = [...new Set(items.map((item) => String(item.restaurantId || "").trim()).filter(Boolean))];
    const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } });
    const user =
      req.user?.role === "client" ? await User.findById(req.user.id) : null;

    const preview = buildPricingPreview(
      restaurants,
      items,
      user,
      req.body.couponRestaurantIds || [],
    );

    if (preview.error) {
      return res.status(400).json({ message: preview.error });
    }

    res.json(preview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/checkout", optionalProtect, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const restaurantIds = [...new Set(items.map((item) => String(item.restaurantId || "").trim()).filter(Boolean))];
    const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } });
    const user =
      req.user?.role === "client" ? await User.findById(req.user.id) : null;

    const preview = buildPricingPreview(
      restaurants,
      items,
      user,
      req.body.couponRestaurantIds || [],
    );

    if (preview.error) {
      return res.status(400).json({ message: preview.error });
    }

    const customerName = String(req.body.customerName || "").trim() || user?.fullName || "Guest";
    const createdOrders = [];

    for (const group of preview.groups) {
      const restaurant = restaurants.find(
        (entry) => String(entry._id) === String(group.restaurantId),
      );
      if (!restaurant) continue;

      const order = {
        customer: user?._id || null,
        customerName,
        status: "paid",
        items: group.items,
        subtotalAmount: group.subtotalAmount,
        discountAmount: group.discountAmount,
        totalAmount: group.totalAmount,
        discountSummary: group.discountSummary,
        couponApplied: group.couponApplied,
        estimatedReadyAt: getEstimatedReadyAt(new Date(), group.totalQuantity),
        createdAt: new Date(),
      };

      restaurant.orders.push(order);
      await restaurant.save();
      createdOrders.push(restaurant.orders[restaurant.orders.length - 1]);
    }

    if (user) {
      await applyLoyaltyRewards(user._id, preview.groups);
    }

    res.status(201).json({
      message: "Orders placed successfully",
      pricing: preview,
      orders: createdOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get(
  "/:id/analytics",
  protect,
  ensureRestaurantRole,
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findOne({
        _id: req.params.id,
        owner: req.user.id,
      });
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const orders = [...restaurant.orders].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      const revenue = {
        day: 0,
        week: 0,
        month: 0,
        total: 0,
      };

      const orderCounts = {
        day: 0,
        week: 0,
        month: 0,
        total: orders.length,
      };

      orders.forEach((order) => {
        if (order.status === "cancelled") return;
        const amount = Number(order.totalAmount) || 0;
        const createdAt = new Date(order.createdAt);

        revenue.total += amount;

        if (createdAt >= startOfMonth) {
          revenue.month += amount;
          orderCounts.month += 1;
        }
        if (createdAt >= startOfWeek) {
          revenue.week += amount;
          orderCounts.week += 1;
        }
        if (createdAt >= startOfDay) {
          revenue.day += amount;
          orderCounts.day += 1;
        }
      });

      res.json({
        restaurantId: restaurant._id,
        viewsCount: restaurant.viewsCount || 0,
        revenue,
        orders: orderCounts,
        recentOrders: orders.slice(0, 30),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;
