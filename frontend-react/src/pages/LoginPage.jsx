import { useState } from "react";
import { getApiUrl, saveAuthSession } from "../lib/auth";
import { signInWithGooglePopup } from "../lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const redirectAfterAuth = (role) => {
    if (role === "admin") {
      window.location.href = "/admin";
    } else if (role === "restaurant") {
      window.location.href = "/restaurant-admin";
    } else {
      window.location.href = "/";
    }
  };

  const completeAuth = (data) => {
    saveAuthSession({
      token: data.token,
      user: {
        _id: data._id,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        avatar: data.avatar || "",
      },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      completeAuth(data);

      setLoading(false);
      redirectAfterAuth(data.role);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Unable to login");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const googleUser = await signInWithGooglePopup();
      const response = await fetch(getApiUrl("/api/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: googleUser.idToken,
          mode: "login",
          fullName: googleUser.fullName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Google sign-in failed");
      }

      completeAuth(data);
      setLoading(false);
      redirectAfterAuth(data.role);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Unable to sign in with Google");
    }
  };

  const socialLogin = (provider) => {
    alert(`${provider} sign-in is not connected yet.`);
  };

  const forgotPassword = () => {
    const target = window.prompt("Enter your email to reset password:");
    if (target) {
      alert(`Password reset link sent to ${target}.`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-emerald-50 px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 text-4xl font-bold tracking-tight">
          <span className="text-orange-500">Taste</span>
          <span className="text-emerald-600">Match</span>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-semibold text-center">Welcome back</h1>
          <p className="text-center text-gray-500 mt-2">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-2xl bg-gray-100 border border-transparent focus:border-orange-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-100 border border-transparent focus:border-orange-300 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <i
                    className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-orange-500" />
                Remember me
              </label>
              <button
                type="button"
                onClick={forgotPassword}
                className="text-orange-500">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-3xl disabled:opacity-60">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="my-6 text-center text-gray-400 text-sm">OR</div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="border-2 border-gray-200 hover:border-orange-300 rounded-2xl py-3 font-medium transition flex items-center justify-center gap-2 disabled:opacity-60">
              <i className="fa-brands fa-google text-red-500" />
              Google
            </button>
            <button
              type="button"
              onClick={() => socialLogin("Facebook")}
              className="border-2 border-gray-200 hover:border-orange-300 rounded-2xl py-3 font-medium transition flex items-center justify-center gap-2">
              <i className="fa-brands fa-facebook text-blue-600" />
              Facebook
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-orange-500 font-semibold">
              Sign up
            </a>
          </p>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-gray-500 hover:text-gray-700">
            Back to TasteMatch
          </a>
        </div>
      </div>
    </div>
  );
}
