import { useEffect, useMemo, useRef, useState } from "react";
import {
  clearAuthSession,
  getApiUrl,
  getAuthHeaders,
  getAuthSession,
} from "../lib/auth";

// Fonts
(() => {
  if (document.getElementById("tm-owner-fonts")) return;
  const l = document.createElement("link");
  l.id = "tm-owner-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap";
  document.head.appendChild(l);
})();

// Global CSS
(() => {
  if (document.getElementById("tm-owner-styles")) return;
  const s = document.createElement("style");
  s.id = "tm-owner-styles";
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    :root {
      --orange: #F97316;
      --orange-dark: #EA580C;
      --orange-soft: #FFF7ED;
      --orange-soft-2: #FFEDD5;
      --green: #059669;
      --green-dark: #047857;
      --green-soft: #ECFDF5;
      --bg: #FFFDF9;
      --card: #FFFFFF;
      --line: #F1F5F9;
      --line-2: #E5E7EB;
      --text: #111827;
      --muted: #6B7280;
      --muted-2: #9CA3AF;
      --danger: #DC2626;
      --danger-soft: #FEF2F2;
      --shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.04);
      --shadow-md: 0 10px 30px rgba(15, 23, 42, 0.08);
      --radius-xl: 20px;
      --radius-2xl: 28px;
    }

    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }

    ::-webkit-scrollbar { width: 7px; height: 7px; }
    ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 999px; }
    ::-webkit-scrollbar-track { background: transparent; }

    .tm-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 290px 1fr;
      background: var(--bg);
    }

    .tm-sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(18px);
      border-right: 1px solid var(--line);
      padding: 24px 18px;
    }

    .tm-main {
      min-width: 0;
      padding: 28px;
    }

    .tm-logo {
      text-decoration: none;
      display: inline-flex;
      align-items: baseline;
      gap: 0;
      margin-bottom: 24px;
    }

    .tm-logo-a,
    .tm-logo-b {
      font-family: 'Playfair Display', serif;
      font-size: 30px;
      line-height: 1;
      font-weight: 700;
    }

    .tm-logo-a { color: var(--orange); }
    .tm-logo-b { color: var(--green); }

    .tm-panel {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-sm);
    }

    .tm-soft-panel {
      background: linear-gradient(180deg, #FFFFFF 0%, #FFFDF8 100%);
      border: 1px solid var(--line);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-sm);
    }

    .tm-section {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-sm);
      padding: 24px;
    }

    .tm-title {
      font-family: 'Playfair Display', serif;
      font-size: 34px;
      line-height: 1.05;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .tm-subtitle {
      color: var(--muted);
      font-size: 14px;
      line-height: 1.6;
    }

    .tm-label {
      display: block;
      font-size: 12px;
      color: var(--muted);
      font-weight: 700;
      margin-bottom: 8px;
    }

    .tm-input,
    .tm-textarea {
      width: 100%;
      border: 1px solid var(--line-2);
      border-radius: 16px;
      padding: 13px 15px;
      font-size: 14px;
      color: var(--text);
      background: white;
      outline: none;
      transition: border-color .18s, box-shadow .18s, background .18s;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .tm-input:focus,
    .tm-textarea:focus {
      border-color: var(--orange);
      box-shadow: 0 0 0 4px rgba(249,115,22,.10);
    }

    .tm-textarea {
      resize: vertical;
      min-height: 110px;
    }

    .tm-btn {
      appearance: none;
      border: 0;
      outline: 0;
      border-radius: 16px;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
      transition: transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease, color .16s ease;
    }

    .tm-btn:hover { transform: translateY(-1px); }

    .tm-btn-primary {
      background: var(--orange);
      color: white;
      box-shadow: 0 10px 24px rgba(249,115,22,.22);
    }

    .tm-btn-primary:hover { background: var(--orange-dark); }

    .tm-btn-secondary {
      background: white;
      color: var(--text);
      border: 1px solid var(--line-2);
    }

    .tm-btn-secondary:hover {
      background: #FAFAFA;
    }

    .tm-btn-soft {
      background: var(--orange-soft);
      color: var(--orange-dark);
      border: 1px solid #FED7AA;
    }

    .tm-btn-soft:hover {
      background: var(--orange-soft-2);
    }

    .tm-btn-green {
      background: var(--green-soft);
      color: var(--green-dark);
      border: 1px solid #A7F3D0;
    }

    .tm-btn-green:hover {
      background: #D1FAE5;
    }

    .tm-btn-danger {
      background: white;
      color: var(--danger);
      border: 1px solid #FCA5A5;
    }

    .tm-btn-danger:hover {
      background: var(--danger-soft);
    }

    .tm-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: var(--orange-soft);
      color: var(--orange-dark);
    }

    .tm-chip-green {
      background: var(--green-soft);
      color: var(--green-dark);
    }

    .tm-nav-item {
      width: 100%;
      border: 1px solid transparent;
      background: transparent;
      border-radius: 20px;
      padding: 12px;
      cursor: pointer;
      text-align: left;
      transition: all .18s ease;
    }

    .tm-nav-item:hover {
      background: #FFF8F2;
      border-color: #FED7AA;
    }

    .tm-nav-item.active {
      background: linear-gradient(180deg, #FFF7ED 0%, #FFFFFF 100%);
      border-color: #FDBA74;
      box-shadow: 0 8px 20px rgba(249,115,22,.08);
    }

    .tm-stat-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }

    .tm-stat-grid-five {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 14px;
    }

    .tm-stat-card {
      background: linear-gradient(180deg, #FFFFFF 0%, #FFFCF8 100%);
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 18px;
      box-shadow: var(--shadow-sm);
    }

    .tm-stat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      gap: 8px;
    }

    .tm-stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--muted-2);
      font-weight: 700;
    }

    .tm-stat-value {
      font-size: 28px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text);
    }

    .tm-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }

    .tm-alert {
      border-radius: 18px;
      padding: 14px 16px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 18px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .tm-alert-error {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #B91C1C;
    }

    .tm-alert-success {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #047857;
    }

    .tm-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .tm-grid-profile {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 22px;
      align-items: start;
    }

    .tm-hero {
      background: linear-gradient(135deg, rgba(249,115,22,.08) 0%, rgba(5,150,105,.08) 100%);
      border: 1px solid rgba(249,115,22,.10);
      border-radius: 28px;
      padding: 22px;
      margin-bottom: 22px;
    }

    .tm-form-stack {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .tm-dishes {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .tm-dish-card {
      background: linear-gradient(180deg, #FFFFFF 0%, #FFFCF8 100%);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 16px;
      box-shadow: var(--shadow-sm);
    }

    .tm-dish-preview {
      display: grid;
      grid-template-columns: 92px minmax(0,1fr) auto;
      gap: 14px;
      align-items: center;
      margin-bottom: 14px;
    }

    .tm-dish-image {
      width: 92px;
      height: 92px;
      border-radius: 20px;
      overflow: hidden;
      background: linear-gradient(135deg, #FFF7ED 0%, #ECFDF5 100%);
      border: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
    }

    .tm-dish-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .tm-dish-name {
      font-size: 18px;
      font-weight: 800;
      line-height: 1.2;
      color: var(--text);
      margin-bottom: 6px;
    }

    .tm-dish-desc {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.55;
    }

    .tm-dish-price {
      padding: 10px 14px;
      border-radius: 18px;
      background: var(--orange-soft);
      color: var(--orange-dark);
      font-size: 15px;
      font-weight: 800;
      white-space: nowrap;
    }

    .tm-dish-actions,
    .tm-row-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .tm-upload {
      border: 1px dashed #FDBA74;
      background: linear-gradient(180deg, #FFF8F1 0%, #FFFFFF 100%);
      border-radius: 24px;
      min-height: 240px;
      overflow: hidden;
      cursor: pointer;
      transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
      box-shadow: var(--shadow-sm);
    }

    .tm-upload:hover {
      border-color: var(--orange);
      box-shadow: 0 10px 24px rgba(249,115,22,.10);
      transform: translateY(-1px);
    }

    .tm-upload-empty {
      min-height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      color: var(--muted);
    }

    .tm-upload-empty strong {
      color: var(--text);
      display: block;
      font-size: 15px;
      margin-bottom: 8px;
    }

    .tm-upload-img-wrap {
      position: relative;
      height: 240px;
      background: #F8FAFC;
    }

    .tm-upload-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .tm-upload-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(17,24,39,.04) 0%, rgba(17,24,39,.55) 100%);
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 16px;
      gap: 10px;
    }

    .tm-table-wrap {
      overflow-x: auto;
    }

    .tm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .tm-table th {
      text-align: left;
      color: var(--muted-2);
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
    }

    .tm-table td {
      padding: 16px 0;
      border-bottom: 1px solid var(--line);
      color: #374151;
    }

    .tm-table tr:last-child td {
      border-bottom: none;
    }

    .tm-badge {
      display: inline-flex;
      align-items: center;
      padding: 7px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }

    .tm-badge-pending {
      background: var(--orange-soft);
      color: var(--orange-dark);
    }

    .tm-badge-completed {
      background: var(--green-soft);
      color: var(--green-dark);
    }

    .tm-badge-cancelled {
      background: #FEF2F2;
      color: #B91C1C;
    }

    .tm-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
      gap: 12px;
    }

    .tm-gallery-card {
      position: relative;
      height: 150px;
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid var(--line);
      box-shadow: var(--shadow-sm);
    }

    .tm-gallery-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .tm-gallery-tag {
      position: absolute;
      left: 10px;
      bottom: 10px;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--tag-bg, #F97316);
      color: white;
      font-size: 11px;
      font-weight: 700;
      max-width: calc(100% - 20px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
    }

    .tm-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(17,24,39,.72);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 9999;
    }

    .tm-modal {
      width: 100%;
      max-width: 980px;
      max-height: 86vh;
      overflow: auto;
      background: white;
      border-radius: 28px;
      box-shadow: 0 24px 80px rgba(0,0,0,.22);
      border: 1px solid rgba(255,255,255,.35);
      padding: 24px;
    }

    .tm-image-modal {
      max-width: 920px;
      width: 100%;
    }

    .tm-unsplash-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 14px;
    }

    .tm-unsplash-card {
      position: relative;
      height: 170px;
      border-radius: 18px;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid var(--line);
      box-shadow: var(--shadow-sm);
      transition: transform .16s ease, box-shadow .16s ease;
    }

    .tm-unsplash-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .tm-unsplash-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .tm-owner-card {
      background: linear-gradient(180deg, #FFFFFF 0%, #FFF8F1 100%);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 14px;
    }

    .tm-user-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FED7AA 0%, #A7F3D0 100%);
      color: var(--text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      flex-shrink: 0;
    }

    @media (max-width: 1180px) {
      .tm-shell {
        grid-template-columns: 1fr;
      }

      .tm-sidebar {
        position: relative;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      .tm-grid-profile {
        grid-template-columns: 1fr;
      }

      .tm-stat-grid,
      .tm-stat-grid-five {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 780px) {
      .tm-main { padding: 18px; }
      .tm-title { font-size: 28px; }
      .tm-grid-2 { grid-template-columns: 1fr; }
      .tm-stat-grid,
      .tm-stat-grid-five {
        grid-template-columns: 1fr;
      }
      .tm-dish-preview {
        grid-template-columns: 78px minmax(0,1fr);
      }
      .tm-dish-price {
        grid-column: 2 / 3;
        justify-self: start;
        margin-top: 6px;
      }
      .tm-modal {
        padding: 18px;
        border-radius: 22px;
      }
    }
  `;
  document.head.appendChild(s);
})();

function emptyForm() {
  return {
    name: "",
    description: "",
    address: "",
    phone: "",
    category: "",
    image: "",
    tags: [],
    menu: [{ name: "", description: "", price: "", image: "" }],
  };
}

// Clean AI-generated description: remove questions and extra explanations
function cleanDescription(text) {
  if (!text) return "";

  // Split by sentence
  let sentences = text.split(/(?<=[.!?])\s+/);

  // Remove any sentences that are questions
  sentences = sentences.filter((s) => !s.trim().endsWith("?"));

  // Join back and limit to first 2-3 sentences
  let cleaned = sentences.slice(0, 3).join(" ").trim();

  // Remove "Would you like...", "Let me know...", "Feel free to..." patterns
  cleaned = cleaned
    .replace(
      /\b(Would|Would you|Let me|Feel free|Don't hesitate|Do you|Can I|Thanks for|Thank you|Enjoy|Cheers)\b[^.!?]*[.!?]/gi,
      "",
    )
    .trim();

  return cleaned;
}

function fromRestaurant(r) {
  return {
    name: r.name || "",
    description: r.description || "",
    address: r.address || "",
    phone: r.phone || "",
    category: r.category || "",
    image: r.image || "",
    tags: r.tags || [],
    menu: r.menu?.length
      ? r.menu.map((m) => ({
          name: m.name || "",
          description: m.description || "",
          price: String(m.price ?? ""),
          image: m.image || "",
        }))
      : [{ name: "", description: "", price: "", image: "" }],
  };
}

function readFile(file, cb) {
  const r = new FileReader();
  r.onload = (e) => cb(e.target.result);
  r.readAsDataURL(file);
}

function formatCurrency(v) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v || 0);
}

function badgeClass(s) {
  if (s === "completed") return "tm-badge tm-badge-completed";
  if (s === "cancelled") return "tm-badge tm-badge-cancelled";
  return "tm-badge tm-badge-pending";
}

function ImageUploadField({ value, onChange, label }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);

  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(e.type === "dragenter" || e.type === "dragover");
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    if (e.dataTransfer.files?.[0]) {
      readFile(e.dataTransfer.files[0], onChange);
    }
  };

  return (
    <div
      className="tm-upload"
      onClick={() => !value && ref.current?.click()}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      style={{
        borderColor: drag ? "var(--orange)" : undefined,
        boxShadow: drag ? "0 12px 28px rgba(249,115,22,.12)" : undefined,
      }}>
      {value ? (
        <div className="tm-upload-img-wrap">
          <img src={value} alt={label} />
          <div className="tm-upload-overlay">
            <button
              type="button"
              className="tm-btn tm-btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                ref.current?.click();
              }}>
              Change photo
            </button>
            <button
              type="button"
              className="tm-btn tm-btn-danger"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="tm-upload-empty">
          <div>
            <div style={{ fontSize: 46, marginBottom: 12 }}>🖼️</div>
            <strong>{label}</strong>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              Drag and drop an image here, or click to upload from your device.
            </div>
          </div>
        </div>
      )}

      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) readFile(e.target.files[0], onChange);
        }}
      />
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="tm-stat-card">
      <div className="tm-stat-top">
        <span className="tm-stat-label">{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div className="tm-stat-value" style={{ color: color || "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}

export default function RestaurantProfilePage() {
  const [session, setSession] = useState(() => getAuthSession());
  const [authChecked, setAuthChecked] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [unsplashResults, setUnsplashResults] = useState(null);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashTarget, setUnsplashTarget] = useState(null);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r._id === selectedId) || null,
    [restaurants, selectedId],
  );

  const totalGalleryImages =
    (form.image ? 1 : 0) + form.menu.filter((m) => m.image).length;

  const loadAnalytics = async (rid) => {
    if (!rid) {
      setAnalytics(null);
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/restaurants/${rid}/analytics`), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    }
  };

  const loadRestaurants = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/api/restaurants/mine"), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setRestaurants(data);

      if (data.length) {
        const active = data.find((r) => r._id === selectedId) || data[0];
        setSelectedId(active._id);
        setForm(fromRestaurant(active));
        await loadAnalytics(active._id);
      } else {
        setSelectedId(null);
        setForm(emptyForm());
        setAnalytics(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cur = getAuthSession();

    if (!cur?.token || cur.user?.role !== "restaurant") {
      window.location.href = "/login";
      return;
    }

    (async () => {
      try {
        const res = await fetch(getApiUrl("/api/auth/me"), {
          headers: getAuthHeaders(),
        });
        const data = await res.json();

        if (!res.ok || data.role !== "restaurant") throw new Error();

        setSession((p) => ({ ...p, user: data }));
        setAuthChecked(true);
        loadRestaurants();
      } catch {
        clearAuthSession();
        window.location.href = "/login";
      }
    })();
  }, []);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateMenuField = (index, field, value) =>
    setForm((prev) => ({
      ...prev,
      menu: prev.menu.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    }));

  const addMenuItem = () =>
    setForm((prev) => ({
      ...prev,
      menu: [...prev.menu, { name: "", description: "", price: "", image: "" }],
    }));

  const removeMenuItem = (index) =>
    setForm((prev) => {
      const next = prev.menu.filter((_, idx) => idx !== index);
      return {
        ...prev,
        menu: next.length
          ? next
          : [{ name: "", description: "", price: "", image: "" }],
      };
    });

  const selectRestaurant = async (restaurant) => {
    setSelectedId(restaurant._id);
    setForm(fromRestaurant(restaurant));
    setMessage("");
    setError("");
    await loadAnalytics(restaurant._id);
  };

  const createNew = () => {
    setSelectedId(null);
    setForm(emptyForm());
    setAnalytics(null);
    setMessage("");
    setError("");
  };

  const saveRestaurant = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      menu: form.menu
        .filter((m) => m.name.trim() && m.price !== "")
        .map((m) => ({
          name: m.name.trim(),
          description: m.description.trim(),
          price: Number(m.price),
          image: m.image,
        })),
    };

    try {
      const isEdit = Boolean(selectedId);
      const url = isEdit
        ? getApiUrl(`/api/restaurants/${selectedId}`)
        : getApiUrl("/api/restaurants");

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage(isEdit ? "Restaurant updated." : "Restaurant created.");
      await loadRestaurants();
      setSelectedId(data._id);
      setForm(fromRestaurant(data));
      await loadAnalytics(data._id);
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteRestaurant = async (id) => {
    if (!window.confirm("Delete this restaurant? This cannot be undone."))
      return;

    try {
      const res = await fetch(getApiUrl(`/api/restaurants/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage("Restaurant deleted.");

      if (selectedId === id) {
        setSelectedId(null);
        setForm(emptyForm());
        setAnalytics(null);
      }

      await loadRestaurants();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  const logout = () => {
    clearAuthSession();
    window.location.href = "/login";
  };

  const generateDescription = async (type, index = null) => {
    const key = type === "restaurant" ? "restaurant" : `menu-${index}`;
    setAiLoading(key);
    setError("");

    try {
      if (type === "menu" && !form.menu[index]?.name) {
        setError("Enter a dish name first.");
        setAiLoading(null);
        return;
      }

      const prompt =
        type === "restaurant"
          ? `Write ONLY a polished 2-3 sentence restaurant description for "${form.name}" serving ${form.category} cuisine. Make it warm, modern, and appetizing. Do NOT ask questions or add explanations. Just the description.`
          : `Write ONLY a short 1-2 sentence appetizing menu description for "${form.menu[index].name}". Do NOT ask questions, do NOT add explanations, do NOT mention the restaurant. Just the dish description.`;

      const res = await fetch(getApiUrl("/api/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          restaurants: [],
          history: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      let text = data.reply?.trim() || "";

      // Clean the description: remove questions and conversational elements
      text = cleanDescription(text);

      if (type === "restaurant") {
        updateField("description", text);
        setMessage("Description generated.");
      } else {
        updateMenuField(index, "description", text);
        setMessage("Dish description generated.");
      }
    } catch (err) {
      setError(err.message || "AI generation failed");
    } finally {
      setAiLoading(null);
    }
  };

  const fetchUnsplashImages = async (
    type,
    index = null,
    searchQuery = null,
  ) => {
    const key = type === "restaurant" ? "restaurant" : `menu-${index}`;
    const target =
      searchQuery ||
      (type === "restaurant"
        ? `${form.name} restaurant food`
        : form.menu[index]?.name);

    if (!target) {
      setError("Please enter a name first.");
      return;
    }

    setUnsplashTarget(key);
    setUnsplashLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/api/ai/unsplash"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: target }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUnsplashResults(data.images);
    } catch (err) {
      setError(err.message || "Failed to fetch images");
    } finally {
      setUnsplashLoading(false);
    }
  };

  const selectUnsplashImage = (image) => {
    if (unsplashTarget === "restaurant") {
      updateField("image", image.url);
    } else {
      const idx = parseInt(unsplashTarget.split("-")[1], 10);
      updateMenuField(idx, "image", image.url);
    }

    setUnsplashResults(null);
    setMessage(`Photo selected from Unsplash (${image.photographer}).`);
  };

  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--muted)",
          fontSize: 14,
        }}>
        Verifying access…
      </div>
    );
  }

  return (
    <div className="tm-shell">
      <aside
        style={{
          width: 272,
          flexShrink: 0,
          background: "#fffaf5",
          borderRight: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}>
        <a
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "baseline",
            marginBottom: 28,
            padding: "0 6px",
          }}>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 30,
              fontWeight: 700,
              color: "#F97316",
              lineHeight: 1,
            }}>
            Taste
          </span>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 30,
              fontWeight: 700,
              color: "#059669",
              lineHeight: 1,
            }}>
            Match
          </span>
        </a>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            padding: "0 6px",
          }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#9CA3AF",
              letterSpacing: ".04em",
            }}>
            My Restaurants
          </span>

          <button
            type="button"
            onClick={createNew}
            style={{
              border: "none",
              background: "#F97316",
              color: "white",
              borderRadius: 12,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            + New
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 0,
            overflowY: "auto",
          }}>
          {restaurants.map((r) => {
            const active = selectedId === r._id;

            return (
              <button
                key={r._id}
                type="button"
                onClick={() => selectRestaurant(r)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: active
                    ? "1px solid #FDBA74"
                    : "1px solid transparent",
                  background: active ? "#fff7ed" : "transparent",
                  borderRadius: 18,
                  padding: "12px",
                  cursor: "pointer",
                  transition: "all .18s ease",
                  boxShadow: active
                    ? "0 8px 20px rgba(249,115,22,.08)"
                    : "none",
                }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}>
                  {r.image ? (
                    <img
                      src={r.image}
                      alt={r.name}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background:
                          "linear-gradient(135deg, #FFF7ED 0%, #ECFDF5 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                      }}>
                      🍽️
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: active ? "#EA580C" : "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                      {r.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginTop: 4,
                      }}>
                      {r.category || "Restaurant"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {!restaurants.length && !loading && (
            <div
              style={{
                textAlign: "center",
                padding: "24px 10px",
                color: "#6B7280",
                background: "white",
                border: "1px solid #f1f5f9",
                borderRadius: 18,
              }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🍴</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                No restaurants yet
              </div>
              <div style={{ fontSize: 13 }}>Click "New" to create one.</div>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #f1f5f9",
          }}>
          <div
            style={{
              background: "white",
              border: "1px solid #f1f5f9",
              borderRadius: 18,
              padding: 14,
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #FED7AA 0%, #A7F3D0 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: "#111827",
                  flexShrink: 0,
                }}>
                {session?.user?.fullName?.[0] || "?"}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                  {session?.user?.fullName}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  Restaurant Owner
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{
                width: "100%",
                border: "1px solid #E5E7EB",
                background: "white",
                color: "#111827",
                borderRadius: 14,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="tm-main">
        <div className="tm-toolbar" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="tm-title">
              {selectedRestaurant
                ? selectedRestaurant.name
                : "Create restaurant"}
            </h1>

            <div className="tm-subtitle" style={{ marginTop: 10 }}>
              {selectedRestaurant
                ? "Update your restaurant profile, menu, visuals, and performance."
                : "Set up a polished restaurant profile with a real food-app feel."}
            </div>

            {selectedRestaurant && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 14,
                }}>
                <span className="tm-chip">{selectedRestaurant.category}</span>
                {selectedRestaurant.address ? (
                  <span className="tm-chip tm-chip-green">
                    📍 {selectedRestaurant.address}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {selectedRestaurant && (
            <button
              type="button"
              className="tm-btn tm-btn-danger"
              onClick={() => deleteRestaurant(selectedRestaurant._id)}>
              Delete restaurant
            </button>
          )}
        </div>

        {error ? (
          <div className="tm-alert tm-alert-error">⚠️ {error}</div>
        ) : null}
        {message ? (
          <div className="tm-alert tm-alert-success">✅ {message}</div>
        ) : null}

        {selectedRestaurant && analytics ? (
          <>
            <div className="tm-stat-grid" style={{ marginBottom: 14 }}>
              <StatCard
                label="Revenue Today"
                value={formatCurrency(analytics.revenue.day)}
                icon="💰"
                color="var(--orange)"
              />
              <StatCard
                label="Revenue Week"
                value={formatCurrency(analytics.revenue.week)}
                icon="📅"
              />
              <StatCard
                label="Revenue Month"
                value={formatCurrency(analytics.revenue.month)}
                icon="📆"
              />
              <StatCard
                label="Revenue Total"
                value={formatCurrency(analytics.revenue.total)}
                icon="🏆"
                color="var(--green)"
              />
            </div>

            <div className="tm-stat-grid-five" style={{ marginBottom: 22 }}>
              <StatCard
                label="Orders Today"
                value={analytics.orders.day}
                icon="🛍️"
              />
              <StatCard
                label="Orders Week"
                value={analytics.orders.week}
                icon="📊"
              />
              <StatCard
                label="Orders Month"
                value={analytics.orders.month}
                icon="📈"
              />
              <StatCard
                label="Orders Total"
                value={analytics.orders.total}
                icon="✅"
              />
              <StatCard label="Views" value={analytics.viewsCount} icon="👁️" />
            </div>

            <div className="tm-section" style={{ marginBottom: 22 }}>
              <div className="tm-toolbar">
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 24,
                    }}>
                    Recent orders
                  </h2>
                  <div className="tm-subtitle" style={{ marginTop: 6 }}>
                    Latest customer activity for this restaurant.
                  </div>
                </div>

                <span className="tm-chip tm-chip-green">
                  {analytics.recentOrders.length} order
                  {analytics.recentOrders.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="tm-table-wrap">
                <table className="tm-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            textAlign: "center",
                            color: "var(--muted)",
                          }}>
                          No orders yet — your first order is on its way.
                        </td>
                      </tr>
                    ) : (
                      analytics.recentOrders.map((order) => (
                        <tr key={order._id}>
                          <td style={{ fontWeight: 700 }}>
                            {order.customerName || "Guest"}
                          </td>
                          <td
                            style={{
                              fontWeight: 800,
                              color: "var(--orange-dark)",
                            }}>
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td>
                            <span className={badgeClass(order.status)}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ color: "var(--muted)" }}>
                            {new Date(order.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

        {selectedRestaurant && totalGalleryImages > 0 ? (
          <div className="tm-section" style={{ marginBottom: 22 }}>
            <div className="tm-toolbar">
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 24,
                  }}>
                  Photo gallery
                </h2>
                <div className="tm-subtitle" style={{ marginTop: 6 }}>
                  A visual preview of your restaurant and dishes.
                </div>
              </div>

              <span className="tm-chip">
                {totalGalleryImages} photo{totalGalleryImages === 1 ? "" : "s"}
              </span>
            </div>

            <div className="tm-gallery">
              {form.image && (
                <div
                  className="tm-gallery-card"
                  onClick={() =>
                    setViewingImage({
                      src: form.image,
                      name: selectedRestaurant.name,
                      type: "restaurant",
                    })
                  }
                  style={{
                    border: "2.5px solid #FFEDD5",
                  }}>
                  <img src={form.image} alt={selectedRestaurant.name} />

                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "#F97316",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: ".04em",
                    }}>
                    RESTAURANT
                  </span>
                </div>
              )}

              {form.menu
                .filter((item) => item.image)
                .map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="tm-gallery-card"
                    onClick={() =>
                      setViewingImage({
                        src: item.image,
                        name: item.name,
                        type: "dish",
                      })
                    }
                    style={{
                      border: "2.5px solid #D1FAE5",
                    }}>
                    <img src={item.image} alt={item.name} />

                    <span
                      style={{
                        position: "absolute",
                        bottom: 8,
                        left: 8,
                        background: "#059669",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "4px 10px",
                        fontSize: 10,
                        fontWeight: 800,
                        maxWidth: "calc(100% - 16px)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                      {item.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        <div className="tm-section">
          <div className="tm-toolbar" style={{ marginBottom: 22 }}>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24,
                }}>
                {selectedRestaurant ? "Restaurant profile" : "New restaurant"}
              </h2>
              <div className="tm-subtitle" style={{ marginTop: 6 }}>
                Keep it visual, clean, and menu-first.
              </div>
            </div>
          </div>

          <form onSubmit={saveRestaurant} className="tm-form-stack">
            <div className="tm-grid-profile">
              <div className="tm-form-stack">
                <div className="tm-grid-2">
                  <div>
                    <label className="tm-label">Restaurant Name</label>
                    <input
                      className="tm-input"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="e.g. La Bella Cucina"
                      required
                    />
                  </div>

                  <div>
                    <label className="tm-label">Cuisine Category</label>
                    <input
                      className="tm-input"
                      value={form.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      placeholder="e.g. Italian, Sushi, Tunisian"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="tm-label">Description</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 10,
                    }}>
                    <textarea
                      className="tm-textarea"
                      value={form.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      placeholder="Describe your restaurant in a warm and appetizing way."
                      required
                    />
                    <button
                      type="button"
                      className="tm-btn tm-btn-green"
                      onClick={() => generateDescription("restaurant")}
                      disabled={aiLoading === "restaurant" || !form.name}
                      style={{ alignSelf: "start" }}>
                      {aiLoading === "restaurant" ? "Generating…" : "✨ AI"}
                    </button>
                  </div>
                </div>

                <div className="tm-grid-2">
                  <div>
                    <label className="tm-label">Address</label>
                    <input
                      className="tm-input"
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="123 Main St, City"
                      required
                    />
                  </div>

                  <div>
                    <label className="tm-label">Phone Number</label>
                    <input
                      className="tm-input"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="tm-label">Cover Photo</label>
                <ImageUploadField
                  value={form.image}
                  onChange={(b64) => updateField("image", b64)}
                  label="Upload your restaurant cover"
                />

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}>
                  <button
                    type="button"
                    className="tm-btn tm-btn-soft"
                    onClick={() => fetchUnsplashImages("restaurant")}
                    disabled={!form.name || unsplashLoading}>
                    {unsplashLoading ? "Searching…" : "🖼️ Use Unsplash"}
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                height: 1,
                background: "var(--line)",
                borderRadius: 999,
                margin: "2px 0",
              }}
            />

            <div className="tm-toolbar" style={{ marginBottom: 4 }}>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 22,
                  }}>
                  Menu
                </h3>
                <div className="tm-subtitle" style={{ marginTop: 6 }}>
                  Make dishes look like a real menu, not a plain form.
                </div>
              </div>

              <button
                type="button"
                className="tm-btn tm-btn-soft"
                onClick={addMenuItem}>
                + Add dish
              </button>
            </div>

            <div className="tm-dishes">
              {form.menu.map((item, index) => (
                <div key={index} className="tm-dish-card">
                  <div className="tm-dish-preview">
                    <div className="tm-dish-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        "🍽️"
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="tm-dish-name">
                        {item.name || "New dish"}
                      </div>
                      <div className="tm-dish-desc">
                        {item.description ||
                          "Add a short description to make this dish more appetizing."}
                      </div>
                    </div>

                    <div className="tm-dish-price">
                      {item.price ? `${item.price} TND` : "--"}
                    </div>
                  </div>

                  <div className="tm-form-stack">
                    <div className="tm-grid-2">
                      <div>
                        <label className="tm-label">Dish Name</label>
                        <input
                          className="tm-input"
                          value={item.name}
                          onChange={(e) =>
                            updateMenuField(index, "name", e.target.value)
                          }
                          placeholder="e.g. Truffle Pasta"
                        />
                      </div>

                      <div>
                        <label className="tm-label">Price</label>
                        <input
                          className="tm-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updateMenuField(index, "price", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="tm-label">Description</label>
                      <textarea
                        className="tm-textarea"
                        value={item.description}
                        onChange={(e) =>
                          updateMenuField(index, "description", e.target.value)
                        }
                        placeholder="Describe the dish in a tasty, simple way."
                        style={{ minHeight: 90 }}
                      />
                    </div>

                    <div className="tm-row-actions">
                      <label
                        className="tm-btn tm-btn-secondary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                        }}>
                        📷 Upload photo
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              readFile(e.target.files[0], (b64) =>
                                updateMenuField(index, "image", b64),
                              );
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        className="tm-btn tm-btn-green"
                        onClick={() => fetchUnsplashImages("menu", index)}
                        disabled={!item.name || unsplashLoading}>
                        {unsplashLoading ? "Searching…" : "🎨 Unsplash"}
                      </button>

                      <button
                        type="button"
                        className="tm-btn tm-btn-green"
                        onClick={() => generateDescription("menu", index)}
                        disabled={aiLoading === `menu-${index}` || !item.name}>
                        {aiLoading === `menu-${index}`
                          ? "Generating…"
                          : "✨ AI"}
                      </button>

                      {item.image ? (
                        <button
                          type="button"
                          className="tm-btn tm-btn-secondary"
                          onClick={() => updateMenuField(index, "image", "")}>
                          Remove photo
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="tm-btn tm-btn-danger"
                        onClick={() => removeMenuItem(index)}>
                        Remove dish
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                paddingTop: 8,
              }}>
              <button
                type="submit"
                className="tm-btn tm-btn-primary"
                disabled={saving}>
                {saving
                  ? "Saving…"
                  : selectedRestaurant
                    ? "Save Changes"
                    : "Create Restaurant"}
              </button>

              {selectedRestaurant ? (
                <button
                  type="button"
                  className="tm-btn tm-btn-secondary"
                  onClick={() => {
                    setForm(fromRestaurant(selectedRestaurant));
                    setMessage("");
                    setError("");
                  }}>
                  Discard Changes
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </main>

      {unsplashResults ? (
        <div
          className="tm-modal-backdrop"
          onClick={() => setUnsplashResults(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tm-toolbar">
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 26,
                  }}>
                  Select a photo
                </h2>
                <div className="tm-subtitle" style={{ marginTop: 6 }}>
                  Choose a visual that matches your restaurant or dish.
                </div>
              </div>

              <button
                type="button"
                className="tm-btn tm-btn-secondary"
                onClick={() => setUnsplashResults(null)}>
                Close
              </button>
            </div>

            {unsplashResults.length === 0 ? (
              <div
                className="tm-panel"
                style={{ padding: 24, textAlign: "center" }}>
                No images found. Try a different search term.
              </div>
            ) : (
              <div className="tm-unsplash-grid">
                {unsplashResults.map((img, i) => (
                  <div
                    key={i}
                    className="tm-unsplash-card"
                    onClick={() => selectUnsplashImage(img)}>
                    <img src={img.thumb} alt={img.alt} />
                    <div
                      style={{
                        position: "absolute",
                        insetInline: 0,
                        bottom: 0,
                        padding: 10,
                        background:
                          "linear-gradient(180deg, rgba(17,24,39,0) 0%, rgba(17,24,39,.76) 100%)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                      {img.photographer}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {viewingImage ? (
        <div
          className="tm-modal-backdrop"
          onClick={() => setViewingImage(null)}>
          <div
            className="tm-image-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "960px" }}>
            <div style={{ position: "relative" }}>
              <img
                src={viewingImage.src}
                alt={viewingImage.name}
                style={{
                  width: "100%",
                  maxHeight: "82vh",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: 26,
                  boxShadow: "0 24px 80px rgba(0,0,0,.28)",
                }}
              />
              <button
                type="button"
                className="tm-btn tm-btn-secondary"
                onClick={() => setViewingImage(null)}
                style={{ position: "absolute", top: 16, right: 16 }}>
                Close
              </button>
            </div>

            <div
              style={{
                color: "white",
                textAlign: "center",
                marginTop: 14,
                fontSize: 15,
                fontWeight: 700,
              }}>
              {viewingImage.type === "restaurant"
                ? `🏢 ${viewingImage.name}`
                : `🍽️ ${viewingImage.name}`}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
