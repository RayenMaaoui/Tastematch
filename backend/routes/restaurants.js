const express = require("express");
const Restaurant = require("../models/Restaurant");
const { protect } = require("../middleware/auth");

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
    rating = 4.5,
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
    rating: Math.max(0, Math.min(5, Number(rating) || 4.5)),
    lat: lat !== null && lat !== undefined ? Number(lat) : null,
    lng: lng !== null && lng !== undefined ? Number(lng) : null,
    menu: sanitizedMenu,
  };
}

// PUBLIC: Get all restaurants
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    // Ensure all restaurants have required fields with defaults
    const normalized = restaurants.map((r) => ({
      ...r.toObject(),
      price: r.price || 2,
      rating: r.rating || 4.5,
      lat: r.lat || null,
      lng: r.lng || null,
      tags: r.tags || [],
    }));
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
    // Ensure all restaurants have required fields with defaults
    const normalized = restaurants.map((r) => ({
      ...r.toObject(),
      price: r.price || 2,
      rating: r.rating || 4.5,
      lat: r.lat || null,
      lng: r.lng || null,
      tags: r.tags || [],
    }));
    res.json(normalized);
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
    const data = restaurant.toObject();
    res.status(201).json({
      ...data,
      price: data.price || 2,
      rating: data.rating || 4.5,
      lat: data.lat || null,
      lng: data.lng || null,
      tags: data.tags || [],
    });
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

    const data = restaurant.toObject();
    res.json({
      ...data,
      price: data.price || 2,
      rating: data.rating || 4.5,
      lat: data.lat || null,
      lng: data.lng || null,
      tags: data.tags || [],
    });
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
