import { useEffect, useState } from "react";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RestaurantProfilePage from "./pages/RestaurantProfilePage";
import ProfilePage from "./pages/ProfilePage";

function normalizePath(pathname) {
  if (!pathname) return "/";
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

const routeMap = {
  "/": HomePage,
  "/frontend-react": HomePage,
  "/homepage": HomePage,
  "/homepage.html": HomePage,
  "/index.html": HomePage,
  "/login": LoginPage,
  "/login.html": LoginPage,
  "/register": RegisterPage,
  "/register.html": RegisterPage,
  "/profile": ProfilePage,
  "/restaurant-admin": RestaurantProfilePage,
  "/restaurant-admin.html": RestaurantProfilePage,
  "/restaurant": RestaurantProfilePage,
  "/restaurant.html": RestaurantProfilePage,
  "/admin": AdminPage,
  "/admin.html": AdminPage,
};

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white border rounded-3xl p-8 text-center max-w-md w-full">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-gray-500 mt-2">
          The route does not match any converted frontend page.
        </p>
        <a
          href="/"
          className="inline-block mt-5 bg-orange-500 text-white px-5 py-2 rounded-3xl">
          Go Home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () =>
      setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const Page = routeMap[path] ?? HomePage;
  return <Page key={path} />;
}
