import { useState, useEffect } from "react";
import {
  getAuthSession,
  clearAuthSession,
  getApiUrl,
  saveAuthSession,
} from "../lib/auth";

export default function ProfilePage() {
  const [session, setSession] = useState(() => getAuthSession());
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    fullName: session?.user?.fullName || "",
    email: session?.user?.email || "",
  });

  useEffect(() => {
    if (!session) {
      window.location.href = "/login";
    }
  }, [session]);

  if (!session) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/auth/update-profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      saveAuthSession({
        token: session.token,
        user: {
          ...session.user,
          fullName: data.fullName,
        },
      });

      setSession((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          fullName: data.fullName,
        },
      }));

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-orange-100 bg-white/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-orange-500">Taste</span>
            <span className="text-emerald-600">Match</span>
          </a>
          <button
            onClick={() => window.history.back()}
            className="text-gray-700 hover:text-orange-500 font-medium transition">
            ← Back
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-emerald-600 h-32" />

          <div className="px-8 pb-8 -mt-16 relative">
            {/* Avatar */}
            <div className="flex items-end gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
                {session.user.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {session.user.fullName || "User"}
                </h1>
                <p className="text-gray-600">
                  {session.user.role?.charAt(0).toUpperCase() +
                    session.user.role?.slice(1) || "Client"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-2xl transition">
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-2xl transition">
                Logout
              </button>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm">
                {success}
              </div>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Account Information
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-2xl focus:border-orange-500 outline-none transition"
                  required
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 font-medium">
                  {session.user.fullName || "Not set"}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 font-medium">
                {session.user.email}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Email cannot be changed
              </p>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-emerald-50 rounded-2xl font-medium text-gray-900">
                {session.user.role === "restaurant"
                  ? "Restaurant Owner"
                  : session.user.role === "admin"
                    ? "Administrator"
                    : "Customer"}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Account type cannot be changed
              </p>
            </div>

            {/* Save Button */}
            {isEditing && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-2xl transition disabled:opacity-60">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}
          </form>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-gray-600 text-sm">Member</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-gray-600 text-sm">Verified</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-gray-600 text-sm">Secure</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-white rounded-3xl shadow-lg p-8 border-l-4 border-red-500">
          <h3 className="text-lg font-bold text-red-600 mb-3">Danger Zone</h3>
          <p className="text-gray-600 text-sm mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-2xl transition border border-red-300">
            Delete Account
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>
            Need help?{" "}
            <a
              href="#"
              className="text-orange-500 hover:text-orange-600 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
