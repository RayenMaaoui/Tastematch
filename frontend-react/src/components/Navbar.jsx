import { useState } from "react";
import { clearAuthSession } from "../lib/auth";

export default function Navbar({
  session,
  search,
  onSearchChange,
  onChatOpen,
  onLogout,
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const getAvatarColor = (userId) => {
    const colors = [
      "bg-orange-500",
      "bg-emerald-600",
      "bg-blue-500",
      "bg-pink-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-teal-500",
    ];
    return colors[userId?.charCodeAt(0) % colors.length] || "bg-orange-500";
  };

  const handleLogout = () => {
    clearAuthSession();
    onLogout();
  };

  return (
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
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search restaurants, cuisine, or dishes"
                  className="bg-transparent outline-none w-full text-gray-700 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3 shrink-0">
              <button
                onClick={onChatOpen}
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
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition ${
                      showDropdown
                        ? "bg-orange-100 text-orange-600"
                        : "hover:bg-orange-50 text-gray-700"
                    }`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                        session.user?._id,
                      )}`}>
                      {getInitials(session.user?.name)}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">
                      {session.user?.name?.split(" ")[0]}
                    </span>
                    <i
                      className={`fa-solid fa-chevron-down text-xs transition ${
                        showDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-orange-100 rounded-2xl shadow-2xl overflow-hidden z-50">
                      {/* User Info */}
                      <div className="px-4 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-emerald-50">
                        <p className="font-semibold text-gray-900">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {session.user?.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <a
                          href="/profile"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-3 hover:bg-orange-50 text-gray-700 transition flex items-center gap-3">
                          <i className="fa-solid fa-user w-4 text-orange-500" />
                          <span className="text-sm font-medium">My Profile</span>
                        </a>

                        <a
                          href="/profile?tab=orders"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-3 hover:bg-orange-50 text-gray-700 transition flex items-center gap-3">
                          <i className="fa-solid fa-receipt w-4 text-orange-500" />
                          <span className="text-sm font-medium">
                            Order History
                          </span>
                        </a>

                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-3 border-t border-orange-100 hover:bg-red-50 text-red-600 transition flex items-center gap-3">
                          <i className="fa-solid fa-sign-out-alt w-4" />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
