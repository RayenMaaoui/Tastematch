export default function MenuModal({
  viewingMenu,
  setViewingMenu,
  setViewingImage,
  setShowChat,
}) {
  if (!viewingMenu) return null;

  const menuItems = viewingMenu.menu || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setViewingMenu(null)}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[28px] bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-emerald-600 px-8 py-7 text-white">
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
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-orange-50/70 to-white px-6 md:px-8 py-6">
          {menuItems.length > 0 ? (
            <div className="space-y-4">
              {menuItems.map((item, idx) => (
                <div
                  key={`menu-item-${item.name}-${idx}`}
                  className="bg-white border border-orange-100 rounded-3xl p-4 md:p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-4 md:gap-5">
                    {/* Dish image */}
                    <div className="shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          onClick={() => setViewingImage(item)}
                          className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover cursor-pointer border border-orange-100"
                        />
                      ) : (
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-100 flex items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Dish details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="mt-2 text-sm md:text-base text-gray-500 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
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
                    </div>
                  </div>
                </div>
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
