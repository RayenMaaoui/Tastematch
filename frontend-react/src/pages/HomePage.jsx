import { useEffect, useMemo, useState } from "react";
import { categories } from "../data/restaurants";
import { clearAuthSession, getApiUrl, getAuthSession } from "../lib/auth";
import MenuModal from "../components/MenuModal";

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
  const [activePrice, setActivePrice] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [search, setSearch] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi. I'm TasteAI. Tell me what you're craving." },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewingMenu, setViewingMenu] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [slide, setSlide] = useState(0);
  const [userCoords, setUserCoords] = useState({ lat: 36.8065, lng: 10.1815 });
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

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

    fetch(getApiUrl("/api/restaurants"))
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
          restaurants: filteredRestaurants.slice(0, 12),
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
    setSelected(restaurant);
  };

  const logout = () => {
    clearAuthSession();
    setSession(null);
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#fffdf9]">
      <nav className="sticky top-0 z-40 border-b border-orange-100 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
              <a
                href="/"
                className="text-3xl font-bold tracking-tight shrink-0">
                <span className="text-orange-500">Taste</span>
                <span className="text-emerald-600">Match</span>
              </a>

              <div className="flex-1">
                <div className="flex items-center bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 shadow-sm">
                  <i className="fa-solid fa-magnifying-glass text-orange-400 mr-3" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search restaurants, cuisine, or dishes"
                    className="bg-transparent outline-none w-full text-gray-700 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-3 shrink-0">
                <button
                  onClick={() => setShowChat(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-sm transition">
                  Talk to TasteAI
                </button>

                {!session && (
                  <a
                    href="/login"
                    className="text-gray-700 hover:text-orange-500 text-sm font-medium">
                    Sign In
                  </a>
                )}

                {session?.user?.role === "admin" && (
                  <a
                    href="/admin"
                    className="text-gray-700 hover:text-orange-500 text-sm font-medium">
                    Admin
                  </a>
                )}

                {session?.user?.role === "restaurant" && (
                  <a
                    href="/restaurant-admin"
                    className="text-gray-700 hover:text-orange-500 text-sm font-medium">
                    Restaurant Admin
                  </a>
                )}

                {session && (
                  <button
                    onClick={logout}
                    className="text-gray-700 hover:text-orange-500 text-sm font-medium">
                    Logout
                  </button>
                )}
              </div>
            </div>

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
      />

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
