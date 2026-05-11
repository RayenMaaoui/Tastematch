const MENU_SECTIONS = [
  {
    id: "pizza",
    label: "Pizzas",
    terms: ["pizza", "margherita", "pepperoni", "quattro", "calzone"],
  },
  {
    id: "burger",
    label: "Burgers & Sandwiches",
    terms: ["burger", "sandwich", "tacos", "wrap", "shawarma", "kebab", "panini"],
  },
  {
    id: "grill",
    label: "Grill & Meat",
    terms: ["grill", "steak", "meat", "beef", "lamb", "chicken", "bbq", "ribs", "brochette"],
  },
  {
    id: "pasta",
    label: "Pasta",
    terms: ["pasta", "spaghetti", "lasagna", "ravioli", "penne", "tagliatelle"],
  },
  {
    id: "seafood",
    label: "Seafood",
    terms: ["fish", "seafood", "shrimp", "calamari", "salmon", "tuna", "octopus"],
  },
  {
    id: "drinks",
    label: "Drinks",
    terms: ["drink", "juice", "smoothie", "milkshake", "coffee", "tea", "soda", "lemonade", "mojito"],
  },
  {
    id: "sweets",
    label: "Sweets",
    terms: ["dessert", "cake", "sweet", "chocolate", "crepe", "waffle", "cookie", "ice cream", "pastry"],
  },
];

function getMenuSection(item) {
  const text = `${item.name || ""} ${item.description || ""}`.toLowerCase();
  return (
    MENU_SECTIONS.find((section) =>
      section.terms.some((term) => text.includes(term)),
    ) || { id: "other", label: "Other Dishes" }
  );
}

function groupMenuItems(items = []) {
  const groups = new Map();

  for (const item of items) {
    const section = getMenuSection(item);
    if (!groups.has(section.id)) {
      groups.set(section.id, { ...section, items: [] });
    }
    groups.get(section.id).items.push(item);
  }

  return [...groups.values()].sort((a, b) => {
    const aIndex = MENU_SECTIONS.findIndex((section) => section.id === a.id);
    const bIndex = MENU_SECTIONS.findIndex((section) => section.id === b.id);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
}

export default function MenuModal({
  viewingMenu,
  setViewingMenu,
  setViewingImage,
  setShowChat,
  onAddToBasket,
  cartItems = [],
}) {
  if (!viewingMenu) return null;

  const menuItems = viewingMenu.menu || [];
  const menuGroups = groupMenuItems(menuItems);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setViewingMenu(null)}>
      <div
        className="w-full max-w-5xl h-[92vh] overflow-hidden rounded-[28px] bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 via-orange-500 to-emerald-600 px-8 py-7 text-white">
          <button
            onClick={() => setViewingMenu(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-lg">
            ✕
          </button>

          <div className="pr-12">
            <p className="text-xs uppercase tracking-[0.25em] text-white/80 mb-2">
              Menu
            </p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {viewingMenu.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/90">
              {viewingMenu.category && (
                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 capitalize">
                  {viewingMenu.category}
                </span>
              )}
              {viewingMenu.phone && (
                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">
                  {viewingMenu.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu body */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-orange-50/70 to-white px-5 md:px-8 py-7">
          {menuItems.length > 0 ? (
            <div className="space-y-9">
              {menuGroups.map((group) => (
                <section key={group.id} className="space-y-4 scroll-mt-6">
                  <div className="rounded-2xl border border-orange-100 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-gray-900">
                        {group.label}
                      </h2>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                        {group.items.length} item
                        {group.items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {group.items.map((item, idx) => {
                const cartEntry = cartItems.find(
                  (cartItem) =>
                    cartItem.restaurantId === viewingMenu._id &&
                    cartItem.dishName === item.name,
                );

                return (
                <div
                  key={`menu-item-${item.name}-${idx}`}
                  className="bg-white border border-orange-100 rounded-3xl p-4 md:p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 md:gap-5">
                    {/* Dish image */}
                    <div className="shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          onClick={() => setViewingImage(item)}
                          className="w-full sm:w-32 h-40 sm:h-32 rounded-2xl object-cover cursor-pointer border border-orange-100"
                        />
                      ) : (
                        <div className="w-full sm:w-32 h-40 sm:h-32 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-100 flex items-center justify-center text-sm font-semibold text-gray-500">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Dish details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="mt-2 text-sm md:text-base text-gray-600 leading-7">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 self-start">
                          <div className="px-4 py-2 rounded-2xl bg-orange-50 border border-orange-100 text-orange-500 font-bold text-lg md:text-xl whitespace-nowrap">
                            {Number(item.price).toFixed(2)} TND
                          </div>
                        </div>
                      </div>

                      {item.image && (
                        <button
                          onClick={() => setViewingImage(item)}
                          className="mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition">
                          View image
                        </button>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                          onClick={() =>
                            onAddToBasket?.(viewingMenu, {
                              dishName: item.name,
                              unitPrice: Number(item.price) || 0,
                              image: item.image || "",
                            })
                          }
                          className="rounded-2xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 text-sm font-semibold transition shadow-sm">
                          Add to basket
                        </button>

                        {cartEntry ? (
                          <span className="text-sm font-medium text-emerald-700">
                            In basket: {cartEntry.quantity}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Ready to order
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-gray-500 text-lg">No menu items available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-orange-100 bg-white px-6 md:px-8 py-5">
          <button
            onClick={() => {
              setViewingMenu(null);
              setShowChat(true);
            }}
            className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 text-white py-3.5 font-semibold transition shadow-sm">
            Ask TasteAI about this menu
          </button>
        </div>
      </div>
    </div>
  );
}
