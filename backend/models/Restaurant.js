const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    dishName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, trim: true, default: "Guest" },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "paid",
    },
    items: { type: [orderItemSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    price: { type: Number, default: 2, min: 1, max: 3 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    tags: {
      type: [String],
      default: [],
    },
    menu: {
      type: [menuItemSchema],
      default: [],
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    orders: {
      type: [orderSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
