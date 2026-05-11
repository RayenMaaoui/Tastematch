const Restaurant = require("../models/Restaurant");
const { isMailerConfigured, sendMail } = require("./mailer");

const DEFAULT_INTERVAL_MS = 60 * 1000;
let intervalId = null;
let isChecking = false;

function formatOrderItems(items = []) {
  return items
    .map((item) => `${item.quantity} x ${item.dishName}`)
    .join(", ");
}

function buildCustomerMessage({ restaurant, order }) {
  const itemSummary = formatOrderItems(order.items);
  const subject = `Your TasteMatch order is ready at ${restaurant.name}`;
  const text = [
    `Hi ${order.customerName || "there"},`,
    "",
    `Your order from ${restaurant.name} is ready.`,
    itemSummary ? `Items: ${itemSummary}` : "",
    `Please go to ${restaurant.name} to claim it.`,
    restaurant.address ? `Address: ${restaurant.address}` : "",
    "",
    "Thanks for using TasteMatch.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, text };
}

function buildRestaurantMessage({ restaurant, order }) {
  const itemSummary = formatOrderItems(order.items);
  const subject = `Order ready for pickup: ${order.customerName || "Guest"}`;
  const text = [
    `Hi ${restaurant.name},`,
    "",
    `An order is now ready for ${order.customerName || "Guest"}.`,
    itemSummary ? `Items: ${itemSummary}` : "",
    "Please have it ready for pickup when the customer arrives.",
    "",
    "TasteMatch",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, text };
}

async function notifyOrderReady({ restaurant, order }) {
  const customerEmail = order.customer?.email || "";
  const restaurantEmail = restaurant.owner?.email || "";
  const messages = [];

  if (customerEmail) {
    messages.push(
      sendMail({
        to: customerEmail,
        ...buildCustomerMessage({ restaurant, order }),
      }),
    );
  }

  if (restaurantEmail) {
    messages.push(
      sendMail({
        to: restaurantEmail,
        ...buildRestaurantMessage({ restaurant, order }),
      }),
    );
  }

  const settled = await Promise.allSettled(messages);
  return settled.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { skipped: true, reason: result.reason?.message || "Email failed" },
  );
}

async function checkReadyOrders() {
  if (!isMailerConfigured() || isChecking) return;

  isChecking = true;
  try {
    const now = new Date();
    const restaurants = await Restaurant.find({
      orders: {
        $elemMatch: {
          status: { $ne: "cancelled" },
          estimatedReadyAt: { $lte: now },
          readyNotificationSentAt: null,
        },
      },
    })
      .populate("owner", "email fullName")
      .populate("orders.customer", "email fullName");

    for (const restaurant of restaurants) {
      let changed = false;

      for (const order of restaurant.orders) {
        const isReady =
          order.status !== "cancelled" &&
          !order.readyNotificationSentAt &&
          order.estimatedReadyAt &&
          new Date(order.estimatedReadyAt).getTime() <= now.getTime();

        if (!isReady) continue;

        const results = await notifyOrderReady({ restaurant, order });
        const sentAny = results.some((result) => !result.skipped);

        if (sentAny || results.length === 0) {
          order.readyNotificationSentAt = now;
          changed = true;
        }
      }

      if (changed) {
        await restaurant.save();
      }
    }
  } catch (error) {
    console.error("Order-ready notification check failed:", error.message);
  } finally {
    isChecking = false;
  }
}

function startOrderReadyNotifier(intervalMs = DEFAULT_INTERVAL_MS) {
  if (!isMailerConfigured()) {
    console.log("Order-ready email notifier disabled: SMTP is not configured");
    return null;
  }

  if (intervalId) return intervalId;

  checkReadyOrders();
  intervalId = setInterval(checkReadyOrders, intervalMs);
  console.log("Order-ready email notifier started");
  return intervalId;
}

module.exports = {
  checkReadyOrders,
  startOrderReadyNotifier,
};
