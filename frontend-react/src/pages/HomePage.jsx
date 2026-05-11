import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories } from "../data/restaurants";
import {
  getApiUrl,
  getAuthHeaders,
  getAuthSession,
} from "../lib/auth";
import MenuModal from "../components/MenuModal";
import Navbar from "../components/Navbar";

const CART_KEY = "tastematch_basket";

function formatTnd(value) {
  return `${Number(value || 0).toFixed(2)} TND`;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

async function parseJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw new Error(
        text.startsWith("<!DOCTYPE")
          ? "The backend returned an HTML page instead of JSON. Restart the backend server and try again."
          : text || "The server returned an invalid response.",
      );
    }

    return {};
  }
}

function RestaurantCard({ restaurant, onClick }) {
  const getMinPrice = () => {
    if (!restaurant.menu || restaurant.menu.length === 0) return null;
    const prices = restaurant.menu
      .map((item) => Number(item.price))
      .filter((p) => !isNaN(p));
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const minPrice = getMinPrice();

  return (
    <button
      onClick={() => onClick(restaurant)}
      className="group w-full text-left bg-white rounded-[28px] overflow-hidden border border-orange-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-56 object-cover group-hover:scale-[1.03] transition duration-500"
        />

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full bg-white/95 text-gray-800 text-xs font-semibold shadow-sm capitalize">
            {restaurant.category}
          </span>
        </div>

        <div className="absolute top-4 right-4">
          <div className="px-3 py-1 rounded-full bg-white text-orange-500 text-sm font-bold shadow-sm">
            ★ {restaurant.rating || 4.5}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-white text-xl font-bold truncate">
              {restaurant.name}
            </h3>
            <p className="text-white/85 text-sm">
              {restaurant.distance && parseFloat(restaurant.distance) < 99
                ? `${restaurant.distance} km away`
                : "Nearby"}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/95 px-3 py-2 text-orange-500 font-bold text-sm shadow-sm whitespace-nowrap">
            {minPrice !== null
              ? `From ${Number(minPrice).toFixed(0)} TND`
              : "View menu"}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {(restaurant.tags || []).slice(0, 3).map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium border border-orange-100">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Explore menu and restaurant details
          </p>
          <span className="text-emerald-600 font-semibold text-sm group-hover:translate-x-1 transition">
            Open →
          </span>
        </div>
      </div>
    </button>
  );
}

function FilterChip({
  active,
  children,
  onClick,
  activeClassName = "bg-orange-500 text-white shadow-sm",
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
        active
          ? activeClassName
          : "bg-white text-gray-700 border border-orange-100 hover:border-orange-300 hover:bg-orange-50"
      }`}>
      {children}
    </button>
  );
}

export default function HomePage() {
  const [session, setSession] = useState(() => getAuthSession());
  const [activeCategories, setActiveCategories] = useState(["all"]);
  const [search, setSearch] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi. I'm TasteAI. Tell me what you're craving." },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [viewingMenu, setViewingMenu] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [slide, setSlide] = useState(0);
  const [userCoords, setUserCoords] = useState({ lat: 36.8065, lng: 10.1815 });
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [basket, setBasket] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : { items: [] };
    } catch {
      return { items: [] };
    }
  });
  const [basketOpen, setBasketOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [clientOrders, setClientOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderActionLoading, setOrderActionLoading] = useState("");
  const [pricingPreview, setPricingPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedCoupons, setSelectedCoupons] = useState({});
  const [customerName, setCustomerName] = useState(
    () => getAuthSession()?.user?.fullName || getAuthSession()?.user?.name || "",
  );
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const legacyBasketDrawerEnabled = Boolean(
    Number(import.meta.env.VITE_SHOW_LEGACY_BASKET || 0),
  );
  const legacyBasketItem = {};

  const loadClientOrders = useCallback(async () => {
    if (!getAuthSession()?.token) {
      setClientOrders([]);
      return;
    }

    setOrdersLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/restaurants/orders/mine"), {
        headers: getAuthHeaders(),
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Unable to load your orders");
      }
      setClientOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setCheckoutError(error.message || "Unable to load your orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserCoords({ lat: 36.8065, lng: 10.1815 });
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000,
        },
      );
    }

    fetch(getApiUrl("/api/restaurants"), {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        setAllRestaurants(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load restaurants:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(basket));
  }, [basket]);

  useEffect(() => {
    const name = session?.user?.fullName || session?.user?.name || "";
    if (name) setCustomerName(name);
    loadClientOrders();
  }, [session, loadClientOrders]);

  useEffect(() => {
    if (!showChat) return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chatLoading, showChat]);

  useEffect(() => {
    if (!basketOpen) return;
    loadClientOrders();
  }, [basketOpen, session, loadClientOrders]);

  useEffect(() => {
    if (basket.items.length === 0) {
      setPricingPreview(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    fetch(getApiUrl("/api/restaurants/checkout/preview"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        items: basket.items.map((item) => ({
          restaurantId: item.restaurantId,
          dishName: item.dishName,
          quantity: item.quantity,
        })),
        couponRestaurantIds: Object.keys(selectedCoupons).filter(
          (restaurantId) => selectedCoupons[restaurantId],
        ),
      }),
    })
      .then((response) =>
        parseJsonResponse(response).then((data) => ({ response, data })),
      )
      .then(({ response, data }) => {
        if (cancelled) return;
        if (!response.ok) {
          throw new Error(data.message || "Unable to preview basket pricing");
        }
        setPricingPreview(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setCheckoutError(error.message || "Unable to preview basket pricing");
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [basket.items, selectedCoupons, session]);

  useEffect(() => {
    if (!pricingPreview?.groups?.length) return;

    setSelectedCoupons((prev) => {
      const next = {};

      for (const group of pricingPreview.groups) {
        if (prev[group.restaurantId] && group.couponEligible) {
          next[group.restaurantId] = true;
        }
      }

      const sameKeys =
        Object.keys(prev).length === Object.keys(next).length &&
        Object.keys(prev).every((key) => prev[key] === next[key]);

      return sameKeys ? prev : next;
    });
  }, [pricingPreview]);

  const localizedRestaurants = useMemo(() => {
    const toRadians = (value) => (value * Math.PI) / 180;

    const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = toRadians(lat2 - lat1);
      const dLng = toRadians(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return allRestaurants
      .map((restaurant) => {
        const distanceKm =
          restaurant.lat && restaurant.lng
            ? calculateDistanceKm(
                userCoords.lat,
                userCoords.lng,
                restaurant.lat,
                restaurant.lng,
              )
            : restaurant.distanceKm || 99;

        return {
          ...restaurant,
          distanceKm,
          distance: `${distanceKm.toFixed(1)}`,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [allRestaurants, userCoords]);

  const filteredRestaurants = useMemo(() => {
    return localizedRestaurants.filter((r) => {
      const categoryOk =
        activeCategories.includes("all") ||
        activeCategories.includes(r.category);
      const searchOk =
        !search ||
        `${r.name} ${r.category} ${(r.tags || []).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase());

      return categoryOk && searchOk;
    });
  }, [activeCategories, search, localizedRestaurants]);

  const recommended = useMemo(() => {
    const pageSize = 4;
    const totalPages = Math.max(
      1,
      Math.ceil(localizedRestaurants.length / pageSize),
    );
    const safeSlide = slide % totalPages;
    const start = safeSlide * pageSize;
    return localizedRestaurants.slice(start, start + pageSize);
  }, [slide, localizedRestaurants]);

  const recommendedPageCount = useMemo(() => {
    return Math.max(1, Math.ceil(localizedRestaurants.length / 4));
  }, [localizedRestaurants]);

  const basketCount = useMemo(() => {
    return basket.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [basket]);

  const activeOrderCount = useMemo(() => {
    return clientOrders.filter((order) => order.status !== "cancelled").length;
  }, [clientOrders]);

  const selectedCanRate = useMemo(() => {
    if (!selected?._id) return false;
    return (
      Boolean(selected.canRate) ||
      clientOrders.some(
        (order) =>
          order.restaurantId === selected._id && order.status !== "cancelled",
      )
    );
  }, [clientOrders, selected]);

  const basketSubtotal = useMemo(() => {
    return basket.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
  }, [basket]);

  const basketTotal = pricingPreview?.totalAmount ?? basketSubtotal;
  const basketDiscountTotal =
    pricingPreview?.totalDiscountAmount ??
    Math.max(0, basketSubtotal - basketTotal);
  const multiRestaurantRate = pricingPreview?.multiRestaurantRate ?? 0;

  const basketGroups = useMemo(() => {
    if (pricingPreview?.groups?.length) {
      return pricingPreview.groups;
    }

    const groups = new Map();

    for (const item of basket.items) {
      if (!groups.has(item.restaurantId)) {
        groups.set(item.restaurantId, {
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
          items: [],
          subtotalAmount: 0,
          totalAmount: 0,
          discountAmount: 0,
          discountSummary: "",
          couponEligible: false,
          couponApplied: false,
          availableCoupons: 0,
        });
      }

      const group = groups.get(item.restaurantId);
      group.items.push(item);
      group.subtotalAmount += item.unitPrice * item.quantity;
      group.totalAmount += item.unitPrice * item.quantity;
    }

    return [...groups.values()];
  }, [basket.items, pricingPreview]);

  const toggleCategory = (id) => {
    if (id === "all") {
      setActiveCategories(["all"]);
      return;
    }

    let next = activeCategories.filter((c) => c !== "all");

    if (next.includes(id)) {
      next = next.filter((c) => c !== id);
    } else {
      next = [...next, id];
    }

    setActiveCategories(next.length ? next : ["all"]);
  };

  const sendChat = async (event) => {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = messages.map((msg) => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.text,
      }));

      const response = await fetch(getApiUrl("/api/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          restaurants: localizedRestaurants.slice(0, 80),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.fallbackReply || data.message || "AI chat failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply,
          intent: data.intent,
          recommendations: data.recommendations,
          items: data.dishes,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            error.message ||
            "I could not reach the AI model. Make sure Ollama is running.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const openRestaurant = async (restaurant) => {
    if (restaurant?._id) {
      try {
        await fetch(getApiUrl(`/api/restaurants/${restaurant._id}/view`), {
          method: "POST",
        });
      } catch {
        // no-op
      }
    }
    setRatingValue(Number(restaurant.userRating || 0));
    setRatingMessage("");
    setRatingError("");
    setSelected(restaurant);
  };

  const refreshRestaurant = (updatedRestaurant) => {
    setAllRestaurants((prev) =>
      prev.map((restaurant) =>
        restaurant._id === updatedRestaurant._id ? updatedRestaurant : restaurant,
      ),
    );
    setSelected(updatedRestaurant);
  };

  const submitRating = async (nextRating) => {
    if (!selected?._id || ratingSaving) return;

    setRatingSaving(true);
    setRatingError("");
    setRatingMessage("");
    setRatingValue(nextRating);

    try {
      const response = await fetch(
        getApiUrl(`/api/restaurants/${selected._id}/rating`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ rating: nextRating }),
        },
      );
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to save your rating");
      }

      refreshRestaurant(data);
      setRatingValue(Number(data.userRating || nextRating));
      setRatingMessage("Your rating was saved.");
    } catch (error) {
      setRatingError(error.message || "Unable to save your rating");
      setRatingValue(Number(selected.userRating || 0));
    } finally {
      setRatingSaving(false);
    }
  };

  const addToBasket = (restaurant, item) => {
    setCheckoutMessage("");
    setCheckoutError("");

    setBasket((prev) => {
      const existingIndex = prev.items.findIndex(
        (basketItem) =>
          basketItem.restaurantId === restaurant._id &&
          basketItem.dishName === item.dishName,
      );

      if (existingIndex >= 0) {
        return {
          ...prev,
          items: prev.items.map((basketItem, index) =>
            index === existingIndex
              ? { ...basketItem, quantity: basketItem.quantity + 1 }
              : basketItem,
          ),
        };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            ownerId: restaurant.owner,
            dishName: item.dishName,
            unitPrice: item.unitPrice,
            image: item.image,
            quantity: 1,
          },
        ],
      };
    });

    setBasketOpen(true);
  };

  const removeBasketItem = (restaurantId, dishName) => {
    setBasket((prev) => ({
      items: prev.items.filter(
        (item) =>
          !(
            item.restaurantId === restaurantId && item.dishName === dishName
          ),
      ),
    }));
  };

  const removeRestaurantGroup = (restaurantId) => {
    setBasket((prev) => ({
      items: prev.items.filter((item) => item.restaurantId !== restaurantId),
    }));
    setSelectedCoupons((prev) => {
      const next = { ...prev };
      delete next[restaurantId];
      return next;
    });
  };

  const updateBasketQuantity = (restaurantId, dishName, nextQuantity) => {
    if (nextQuantity < 1) {
      removeBasketItem(restaurantId, dishName);
      return;
    }

    setBasket((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.restaurantId === restaurantId && item.dishName === dishName
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    }));
  };

  const clearBasket = () => {
    setBasket({ items: [] });
    setSelectedCoupons({});
    setPricingPreview(null);
    setCheckoutMessage("");
    setCheckoutError("");
  };

  const placeOrder = async () => {
    if (basket.items.length === 0 || checkoutLoading) {
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");
    setCheckoutMessage("");

    try {
      const response = await fetch(getApiUrl("/api/restaurants/checkout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          customerName: customerName.trim() || "Guest",
          items: basket.items.map((item) => ({
            restaurantId: item.restaurantId,
            dishName: item.dishName,
            quantity: item.quantity,
          })),
          couponRestaurantIds: Object.keys(selectedCoupons).filter(
            (restaurantId) => selectedCoupons[restaurantId],
          ),
        }),
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Failed to place order");
      }

      const orderCount = data.orders?.length || basketGroups.length;
      setBasket({ items: [] });
      setSelectedCoupons({});
      setPricingPreview(null);
      setCheckoutMessage(
        `Order placed successfully for ${pluralize(orderCount, "restaurant")}.`,
      );
      setBasketOpen(true);
      await loadClientOrders();
      try {
        const refreshed = await fetch(getApiUrl("/api/restaurants"), {
          headers: getAuthHeaders(),
        }).then((res) => res.json());
        if (Array.isArray(refreshed)) {
          setAllRestaurants(refreshed);
          if (selected?._id) {
            const updatedSelected = refreshed.find(
              (restaurant) => restaurant._id === selected._id,
            );
            if (updatedSelected) {
              setSelected(updatedSelected);
              setRatingValue(Number(updatedSelected.userRating || 0));
            }
          }
        }
      } catch {
        // The order is already placed; restaurant metadata can refresh later.
      }
    } catch (error) {
      setCheckoutError(error.message || "Unable to place order");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cancelPlacedOrder = async (orderId) => {
    if (!orderId || orderActionLoading) return;

    setOrderActionLoading(orderId);
    setCheckoutError("");
    setCheckoutMessage("");

    try {
      const response = await fetch(
        getApiUrl(`/api/restaurants/orders/${orderId}/cancel`),
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to cancel this order");
      }

      setClientOrders((prev) =>
        prev.map((order) => (order._id === data._id ? data : order)),
      );
      setCheckoutMessage("Order cancelled.");
      await loadClientOrders();
    } catch (error) {
      setCheckoutError(error.message || "Unable to cancel this order");
    } finally {
      setOrderActionLoading("");
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf9]">
      <Navbar
        session={session}
        search={search}
        onSearchChange={setSearch}
        onChatOpen={() => setShowChat(true)}
        basketCount={basketCount + activeOrderCount}
        onBasketOpen={() => setBasketOpen(true)}
        onLogout={() => {
          setSession(null);
          window.location.href = "/";
        }}
      />

      <nav className="border-b border-orange-100 bg-white/50 backdrop-blur-sm sticky top-[89px] z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-gradient-to-r from-orange-50 to-emerald-50 border border-orange-100 rounded-[26px] p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const active = activeCategories.includes(category.id);
                  return (
                    <FilterChip
                      key={category.id}
                      active={active}
                      onClick={() => toggleCategory(category.id)}>
                      {category.label}
                    </FilterChip>
                  );
                })}
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-emerald-600 rounded-[32px] px-8 py-6 md:px-10 md:py-8 text-white mb-8">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,_white_0,_transparent_30%),radial-gradient(circle_at_bottom_right,_white_0,_transparent_35%)]" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium mb-3">
              <span>✨</span>
              <span>AI-powered food discovery</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Find your next perfect meal with AI
            </h1>

            <p className="mt-3 text-white/90 text-sm md:text-base max-w-2xl leading-relaxed">
              Discover restaurants, browse menus, and get personalized food
              suggestions based on your mood, cravings, and location.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => setShowChat(true)}
                className="bg-white text-orange-500 hover:bg-orange-50 font-semibold px-6 py-3 rounded-2xl transition">
                Chat with TasteAI
              </button>

              <button
                onClick={() =>
                  window.scrollTo({
                    top: 650,
                    behavior: "smooth",
                  })
                }
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-2xl transition">
                Browse restaurants
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block animate-spin mb-4">
                <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full"></div>
              </div>
              <p className="text-gray-500">Loading restaurants...</p>
            </div>
          </div>
        ) : (
          <>
            <section className="mb-14">
              <div className="flex items-end justify-between mb-5 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Recommended for you
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Personalized picks based on location and popularity
                  </p>
                </div>

                {recommendedPageCount > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setSlide(
                          (s) =>
                            (s - 1 + recommendedPageCount) %
                            recommendedPageCount,
                        )
                      }
                      className="w-11 h-11 rounded-2xl border border-orange-100 bg-white hover:bg-orange-50 text-gray-700 transition">
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setSlide((s) => (s + 1) % recommendedPageCount)
                      }
                      className="w-11 h-11 rounded-2xl border border-orange-100 bg-white hover:bg-orange-50 text-gray-700 transition">
                      →
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-7">
                {recommended.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant._id || restaurant.id}
                    restaurant={restaurant}
                    onClick={openRestaurant}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-5">
                <h2 className="text-3xl font-bold text-gray-900">
                  All Restaurants
                </h2>
                <p className="text-gray-500 mt-1">
                  Browse nearby places with smart filters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant._id || restaurant.id}
                    restaurant={restaurant}
                    onClick={openRestaurant}
                  />
                ))}
              </div>

              {filteredRestaurants.length === 0 && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-2xl mb-4">
                    🍽️
                  </div>
                  <p className="text-lg font-semibold text-gray-700">
                    No restaurants match your filters
                  </p>
                  <p className="text-gray-500 mt-1">
                    Try changing category, price, or rating
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showChat && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center"
          onClick={() => setShowChat(false)}>
          <div
            className="bg-white w-full md:w-[430px] md:rounded-[28px] h-[82vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between bg-white">
              <div>
                <strong className="text-gray-900">TasteAI</strong>
                <p className="text-xs text-gray-500 mt-0.5">
                  Personalized food recommendations
                </p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-500 hover:text-orange-500 transition">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-orange-50/40 to-white space-y-3">
              {messages.map((msg, idx) => (
                <div key={`${msg.role}-${idx}`}>
                  <div
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-orange-500 text-white"
                          : "bg-white border border-orange-100 text-gray-700 shadow-sm"
                      }`}>
                      {msg.text}
                    </div>
                  </div>

                  {msg.items && msg.items.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-2">
                      {msg.items.map((item) => (
                        <div
                          key={item._id || item.name}
                          className="bg-white border border-orange-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition">
                          <div className="flex items-center gap-3">
                            {/* Image */}
                            <div className="shrink-0">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-20 h-20 rounded-xl object-cover border border-orange-100 cursor-pointer hover:scale-105 transition"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-100 to-emerald-100 border border-orange-100 flex items-center justify-center text-3xl">
                                  🍽️
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-gray-900 text-sm leading-tight mb-0.5">
                                    {item.name}
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    @ {item.restaurant}
                                  </p>
                                </div>
                                <div className="shrink-0 px-2 py-1 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 font-bold text-xs whitespace-nowrap">
                                  {item.price} TND
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-orange-100 text-gray-500 shadow-sm rounded-2xl px-4 py-3 text-sm">
                    TasteAI is searching the menus...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={sendChat}
              className="p-4 border-t border-orange-100 flex gap-2 bg-white">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask for cuisine, mood, or budget"
                className="flex-1 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 outline-none"
                disabled={chatLoading}
              />
              <button
                disabled={chatLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 rounded-2xl disabled:opacity-60 transition font-medium">
                {chatLoading ? "Thinking..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-[30px] max-w-xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <img
              src={selected.image}
              className="w-full h-64 object-cover"
              alt={selected.name}
            />

            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {selected.name}
                  </h3>
                  <p className="text-gray-500 capitalize mt-2">
                    {selected.category}
                    {selected.distance &&
                      parseFloat(selected.distance) < 99 &&
                      ` • ${selected.distance} km`}
                  </p>
                </div>

                <div className="px-3 py-2 rounded-2xl bg-orange-50 text-orange-500 font-bold text-sm border border-orange-100">
                  ★ {selected.rating || 4.5}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(selected.tags || []).map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-orange-100 bg-orange-50/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      Rate this restaurant
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {selected.canRate
                        ? "You can update your rating anytime."
                        : selectedCanRate
                          ? "You can update your rating anytime."
                        : session
                          ? "Place at least one order here to unlock ratings."
                          : "Sign in and place an order here to rate it."}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-orange-600 whitespace-nowrap">
                    {selected.ratingCount || 0} rating
                    {(selected.ratingCount || 0) === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={!selectedCanRate || ratingSaving}
                      onClick={() => submitRating(star)}
                      className={`text-3xl leading-none transition ${
                        star <= ratingValue
                          ? "text-orange-500"
                          : "text-gray-300"
                      } ${
                        selectedCanRate
                          ? "hover:scale-110"
                          : "cursor-not-allowed opacity-60"
                      }`}
                      aria-label={`Rate ${star} out of 5`}>
                      ★
                    </button>
                  ))}
                  {ratingSaving && (
                    <span className="ml-2 text-sm text-gray-500">Saving...</span>
                  )}
                </div>

                {ratingMessage && (
                  <p className="mt-3 text-sm font-medium text-emerald-700">
                    {ratingMessage}
                  </p>
                )}
                {ratingError && (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    {ratingError}
                  </p>
                )}
              </div>

              <div className="mt-7 flex gap-3">
                <button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-semibold transition"
                  onClick={() => setViewingMenu(selected)}>
                  View Menu
                </button>
                <button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-semibold transition"
                  onClick={() => {
                    setSelected(null);
                    setShowChat(true);
                  }}>
                  Chat with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MenuModal
        viewingMenu={viewingMenu}
        setViewingMenu={setViewingMenu}
        setViewingImage={setViewingImage}
        setShowChat={setShowChat}
        onAddToBasket={addToBasket}
        cartItems={basket.items}
      />

      {basketOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex justify-end"
          onClick={() => setBasketOpen(false)}>
          <div
            className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-orange-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your basket</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {basket.items.length > 0 || activeOrderCount > 0
                    ? `${pluralize(activeOrderCount, "active order")} and ${pluralize(basketGroups.length, "basket restaurant")}`
                    : "Add dishes to get started"}
                </p>
              </div>
              <button
                onClick={() => setBasketOpen(false)}
                className="text-gray-500 hover:text-orange-500 text-xl transition">
                x
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-orange-50/40">
              {checkoutError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {checkoutError}
                </div>
              )}

              {checkoutMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {checkoutMessage}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    Placed orders
                  </h3>
                  <button
                    type="button"
                    onClick={loadClientOrders}
                    disabled={ordersLoading}
                    className="rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-orange-50 disabled:opacity-50 transition">
                    {ordersLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {ordersLoading && clientOrders.length === 0 ? (
                  <div className="rounded-3xl border border-orange-100 bg-white p-5 text-sm text-gray-500">
                    Loading your orders...
                  </div>
                ) : clientOrders.length === 0 ? (
                  <div className="rounded-3xl border border-orange-100 bg-white p-5 text-sm text-gray-500">
                    No placed orders yet.
                  </div>
                ) : (
                  clientOrders.slice(0, 6).map((order) => (
                    <div
                      key={order._id}
                      className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900">
                            {order.restaurantName}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            {order.items
                              .map((item) => `${item.quantity}x ${item.dishName}`)
                              .join(", ")}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            order.status === "cancelled"
                              ? "bg-red-50 text-red-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}>
                          {order.status === "cancelled" ? "Cancelled" : "Preparing"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-orange-50 px-3 py-3">
                          <div className="text-xs font-semibold text-gray-500">
                            Ready in
                          </div>
                          <div className="mt-1 text-lg font-bold text-orange-600">
                            {order.readyLabel}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-orange-50 px-3 py-3">
                          <div className="text-xs font-semibold text-gray-500">
                            Total
                          </div>
                          <div className="mt-1 text-lg font-bold text-gray-900">
                            {formatTnd(order.totalAmount)}
                          </div>
                        </div>
                      </div>

                      {order.canCancel ? (
                        <button
                          type="button"
                          onClick={() => cancelPlacedOrder(order._id)}
                          disabled={orderActionLoading === order._id}
                          className="mt-4 w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition">
                          {orderActionLoading === order._id
                            ? "Cancelling..."
                            : "Cancel this order"}
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Current basket
                </h3>
              </div>

              {basket.items.length === 0 ? (
                <div className="rounded-3xl border border-orange-100 bg-white px-6 py-12 text-center">
                  <div className="text-2xl font-semibold text-orange-500 mb-3">
                    Basket
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    Your basket is empty
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Open a menu and add dishes to place an order.
                  </p>
                </div>
              ) : (
                basketGroups.map((group) => (
                  <div
                    key={group.restaurantId}
                    className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-900">
                          {group.restaurantName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {pluralize(group.totalQuantity || 0, "dish")}
                        </p>
                      </div>

                      <button
                        onClick={() => removeRestaurantGroup(group.restaurantId)}
                        className="shrink-0 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition">
                        Cancel order
                      </button>
                    </div>

                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <div
                          key={`${group.restaurantId}-${item.dishName}`}
                          className="rounded-2xl border border-orange-100 bg-orange-50/40 p-3">
                          <div className="flex items-start gap-4">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.dishName}
                                className="w-20 h-20 rounded-2xl object-cover border border-orange-100"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-emerald-100 border border-orange-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                                Item
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="font-bold text-gray-900">
                                    {item.dishName}
                                  </h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {formatTnd(item.unitPrice)} each
                                  </p>
                                </div>
                                <div className="text-sm font-bold text-orange-600 whitespace-nowrap">
                                  {formatTnd(item.unitPrice * item.quantity)}
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      updateBasketQuantity(
                                        group.restaurantId,
                                        item.dishName,
                                        item.quantity - 1,
                                      )
                                    }
                                    className="w-9 h-9 rounded-xl border border-orange-100 bg-white text-gray-700 hover:bg-orange-100 transition">
                                    -
                                  </button>
                                  <span className="min-w-8 text-center font-semibold text-gray-900">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateBasketQuantity(
                                        group.restaurantId,
                                        item.dishName,
                                        item.quantity + 1,
                                      )
                                    }
                                    className="w-9 h-9 rounded-xl border border-orange-100 bg-white text-gray-700 hover:bg-orange-100 transition">
                                    +
                                  </button>
                                </div>

                                <button
                                  onClick={() =>
                                    removeBasketItem(
                                      group.restaurantId,
                                      item.dishName,
                                    )
                                  }
                                  className="text-sm font-medium text-red-600 hover:text-red-700 transition">
                                  Remove dish
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-orange-100 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Before discount</span>
                        <span className="font-semibold text-gray-800">
                          {formatTnd(group.subtotalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Discount
                          {group.discountSummary
                            ? ` (${group.discountSummary})`
                            : ""}
                        </span>
                        <span className="font-semibold text-emerald-700">
                          -{formatTnd(group.discountAmount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-base">
                        <span className="font-semibold text-gray-800">
                          After discount
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatTnd(group.totalAmount)}
                        </span>
                      </div>

                      {group.couponEligible ? (
                        <label className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedCoupons[group.restaurantId])}
                            onChange={(e) =>
                              setSelectedCoupons((prev) => ({
                                ...prev,
                                [group.restaurantId]: e.target.checked,
                              }))
                            }
                            className="mt-1"
                          />
                          <div className="text-sm">
                            <div className="font-semibold text-emerald-800">
                              Free order coupon available
                            </div>
                            <div className="mt-1 text-emerald-700">
                              You can use {pluralize(group.availableCoupons, "coupon")} here.
                            </div>
                          </div>
                        </label>
                      ) : (
                        <div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-3 text-sm text-gray-600">
                          {group.ordersUntilNextCoupon > 0
                            ? `${pluralize(group.ordersUntilNextCoupon, "more order")} from this restaurant until a free-order coupon unlocks.`
                            : "Your next eligible order here unlocks a free-order coupon."}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-orange-100 bg-white px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer name
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 outline-none focus:border-orange-300"
                />
              </div>

              <div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Before discount</span>
                  <span className="font-semibold text-gray-900">
                    {formatTnd(basketSubtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Discount
                    {multiRestaurantRate > 0
                      ? ` (${Math.round(multiRestaurantRate * 100)}% basket bonus included)`
                      : ""}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    -{formatTnd(basketDiscountTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-base">
                  <span className="font-medium text-gray-600">After discount</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {previewLoading ? "Updating..." : formatTnd(basketTotal)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearBasket}
                  disabled={basket.items.length === 0 || checkoutLoading}
                  className="flex-1 rounded-2xl border border-orange-100 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-orange-50 disabled:opacity-50 transition">
                  Cancel basket
                </button>
                <button
                  onClick={placeOrder}
                  disabled={
                    basket.items.length === 0 || checkoutLoading || previewLoading
                  }
                  className="flex-1 rounded-2xl bg-orange-500 hover:bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-50 transition">
                  {checkoutLoading ? "Placing..." : "Place order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {legacyBasketDrawerEnabled && basketOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex justify-end"
          onClick={() => setBasketOpen(false)}>
          <div
            className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-orange-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your basket</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {basket.items.length > 0
                    ? `${pluralize(basketGroups.length, "restaurant")} in this basket`
                    : "Add dishes to get started"}
                </p>
              </div>
              <button
                onClick={() => setBasketOpen(false)}
                className="text-gray-500 hover:text-orange-500 text-xl transition">
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-orange-50/40">
              {checkoutError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {checkoutError}
                </div>
              )}

              {checkoutMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {checkoutMessage}
                </div>
              )}

              {basket.items.length === 0 ? (
                <div className="rounded-3xl border border-orange-100 bg-white px-6 py-12 text-center">
                  <div className="text-4xl mb-3">🧺</div>
                  <p className="text-lg font-semibold text-gray-800">
                    Your basket is empty
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Open a menu and add dishes to place an order.
                  </p>
                </div>
              ) : (
                basketGroups.map(() => {
                  const item = legacyBasketItem;
                  return (
                  <div
                    key={item.dishName}
                    className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.dishName}
                          className="w-20 h-20 rounded-2xl object-cover border border-orange-100"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-emerald-100 border border-orange-100 flex items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {item.dishName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatTnd(item.unitPrice)} each
                            </p>
                          </div>
                          <div className="text-sm font-bold text-orange-600 whitespace-nowrap">
                            {formatTnd(item.unitPrice * item.quantity)}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateBasketQuantity(
                                  item.dishName,
                                  item.quantity - 1,
                                )
                              }
                              className="w-9 h-9 rounded-xl border border-orange-100 bg-orange-50 text-gray-700 hover:bg-orange-100 transition">
                              -
                            </button>
                            <span className="min-w-8 text-center font-semibold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateBasketQuantity(
                                  item.dishName,
                                  item.quantity + 1,
                                )
                              }
                              className="w-9 h-9 rounded-xl border border-orange-100 bg-orange-50 text-gray-700 hover:bg-orange-100 transition">
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => updateBasketQuantity(item.dishName, 0)}
                            className="text-sm font-medium text-red-600 hover:text-red-700 transition">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-orange-100 bg-white px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer name
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 outline-none focus:border-orange-300"
                />
              </div>

              <div className="flex items-center justify-between text-base">
                <span className="font-medium text-gray-600">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatTnd(basketTotal)}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearBasket}
                  disabled={basket.items.length === 0 || checkoutLoading}
                  className="flex-1 rounded-2xl border border-orange-100 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-orange-50 disabled:opacity-50 transition">
                  Clear
                </button>
                <button
                  onClick={placeOrder}
                  disabled={basket.items.length === 0 || checkoutLoading}
                  className="flex-1 rounded-2xl bg-orange-500 hover:bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-50 transition">
                  {checkoutLoading ? "Placing..." : "Place order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}>
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}>
            <img
              src={viewingImage.image}
              alt={viewingImage.name}
              className="w-full rounded-3xl shadow-2xl"
            />
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-12 right-0 text-white text-3xl font-bold hover:text-orange-400 transition">
              ✕
            </button>
            <div className="text-white text-center mt-4 text-lg font-semibold">
              {viewingImage.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
