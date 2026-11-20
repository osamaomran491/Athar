// bookingService.js
// Talks to the backend for Bookings & Dashboard stats.
// Supports localStorage persistence so user actions (Accept, Reject, Edit, Cancel & Refund)
// survive page refresh and dynamically sync with the Dashboard!
import { getToken } from "./authService";

const API_URL = import.meta.env.VITE_API_URL;
const LIST_PATH = "/api/bookings";
const DETAILS_PATH = (id) => `/api/bookings/${encodeURIComponent(id)}`;
const UPDATE_PATH = (id) => `/api/bookings/${encodeURIComponent(id)}`;
export const USE_MOCK_FALLBACK = true;

const BOOKINGS_STORAGE_KEY = "Athar_booking_overrides";

/* ---------- Local Storage Helpers ---------- */
export function getStoredOverrides() {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveStoredOverride(id, changes) {
  const overrides = getStoredOverrides();
  overrides[String(id)] = {
    ...(overrides[String(id)] || {}),
    ...changes,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(overrides));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("athar_bookings_updated"));
  }
}

/* ---------- Request Helper ---------- */
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

/* ---------- Normalizing ---------- */
const pick = (obj, keys) => {
  for (const k of keys) {
    const v = k.split(".").reduce((o, p) => (o == null ? o : o[p]), obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
};

function normalizeType(raw) {
  const t = String(raw || "").toLowerCase();
  return t.includes("robot") ? "Robot Tour" : "Museum";
}

function normalizeStatus(raw) {
  const s = String(raw || "").toLowerCase();
  if (s.startsWith("confirm") || s === "accepted") return "confirmed";
  if (s.startsWith("cancel") || s === "rejected" || s === "refunded") return "cancelled";
  return "pending";
}

export function normalizeBooking(raw = {}, index = 0) {
  // Use index + 1 if id is missing or formatted
  const rawId = pick(raw, ["id", "_id", "bookingId", "booking_id"]);
  const assignedId = index !== undefined ? index + 1 : Number(rawId) || 1;

  const tickets = Number(pick(raw, ["tickets", "ticketCount", "ticket_count"])) || 1;
  const totalPrice = Number(pick(raw, ["totalPrice", "total_price", "price", "amount"])) || 150 * tickets;

  return {
    id: assignedId,
    visitor: pick(raw, ["visitor", "visitorName", "visitor_name", "user.name", "userName", "name", "customerName"]) || "Visitor",
    email: pick(raw, ["email", "visitorEmail", "visitor_email", "user.email"]) || "visitor@example.com",
    phone: pick(raw, ["phone", "visitorPhone", "visitor_phone", "user.phone"]) || "+20 100 000 0000",
    date: pick(raw, ["dateTime", "date_time", "visitDate", "visit_date", "date", "bookingDate", "createdAt"]),
    type: normalizeType(pick(raw, ["type", "bookingType", "booking_type", "category"])),
    status: normalizeStatus(pick(raw, ["status", "bookingStatus", "booking_status"])),
    tickets,
    totalPrice,
    paymentStatus: pick(raw, ["paymentStatus", "payment_status"]) || "paid",
    museum: pick(raw, ["museum", "museumName", "museum_name"]) || "Egyptian Museum",
    raw,
  };
}

const toList = (data) => {
  const list = Array.isArray(data) ? data : data.bookings || data.data || data.items || data.results || [];
  return Array.isArray(list) ? list : [];
};

/* ---------- Demo Mock Data ---------- */
const NAMES = ["Sarah Ahmed", "Omar Hassan", "Mona Khaled", "Youssef Ali", "Laila Mahmoud", "Karim Adel"];
function buildMock() {
  const first = [
    [1, "Oct 16 2026 10:00", "museum", "confirmed"],
    [2, "Oct 14 2026 11:00", "robot_tour", "confirmed"],
    [3, "Oct 15 2026 13:00", "museum", "pending"],
    [4, "Oct 17 2026 09:00", "robot_tour", "confirmed"],
    [5, "Oct 17 2026 00:00", "museum", "cancelled"],
    [6, "Oct 18 2026 11:00", "robot_tour", "confirmed"],
  ];
  const statuses = ["confirmed", "pending", "cancelled", "confirmed"];
  const rows = first.map(([id, d, type, status]) => ({
    id,
    visitor: "Sarah Ahmed",
    dateTime: new Date(d).toISOString(),
    type,
    status
  }));

  for (let i = 0; i < 24; i++) {
    rows.push({
      id: 7 + i,
      visitor: NAMES[i % NAMES.length],
      dateTime: new Date(2026, 9, 19 + (i % 10), 9 + (i % 8), 0).toISOString(),
      type: i % 2 ? "robot_tour" : "museum",
      status: statuses[i % statuses.length],
    });
  }

  return rows.map((r, i) => {
    const tickets = 1 + (i % 4);
    const totalPrice = (r.type === "robot_tour" ? 250 : 150) * tickets;
    return {
      ...r,
      email: `${r.visitor.split(" ")[0].toLowerCase()}${i + 1}@example.com`,
      phone: `+20 10${String(12340000 + i * 3719).slice(0, 8)}`,
      tickets,
      totalPrice,
      paymentStatus: r.status === "cancelled" ? "refunded" : r.status === "pending" ? "unpaid" : "paid",
      museum: "Egyptian Museum",
      createdAt: new Date(2026, 9, 1 + (i % 12), 14, 30).toISOString(),
    };
  });
}

/* ---------- Apply Local Overrides ---------- */
function applyOverrides(list) {
  const overrides = getStoredOverrides();
  return list.map((item, index) => {
    // Sequential ID starting from 1
    const id = index + 1;
    const base = { ...item, id };
    const ov = overrides[String(id)];
    if (!ov) return base;
    return {
      ...base,
      ...ov,
      raw: { ...(base.raw || {}), ...ov },
    };
  });
}

/* ---------- Public Booking API ---------- */
export async function fetchBookings() {
  try {
    const rawList = toList(await request(LIST_PATH));
    if (rawList.length > 0) {
      const normalized = rawList.map((item, idx) => normalizeBooking(item, idx));
      return { list: applyOverrides(normalized), demo: false };
    }
    throw new Error("Empty list");
  } catch (err) {
    if (!USE_MOCK_FALLBACK && err.message !== "Empty list") throw err;
    const normalized = buildMock().map((item, idx) => normalizeBooking(item, idx));
    return { list: applyOverrides(normalized), demo: true };
  }
}

export async function fetchBookingById(id, { demo = false, fallback } = {}) {
  const overrides = getStoredOverrides();
  const ov = overrides[String(id)];

  if (demo || fallback) {
    return ov ? { ...fallback, ...ov, id: Number(id) } : { ...fallback, id: Number(id) };
  }

  try {
    const data = await request(DETAILS_PATH(id));
    const booking = normalizeBooking(data.booking || data.data || data);
    return ov ? { ...booking, ...ov, id: Number(id) } : { ...booking, id: Number(id) };
  } catch {
    return ov ? { ...fallback, ...ov, id: Number(id) } : { ...fallback, id: Number(id) };
  }
}

/** Update booking status (Accept / Reject / Cancel). */
export async function updateBookingStatus(id, newStatus, { demo = false } = {}) {
  const changes = { status: newStatus };
  if (newStatus === "confirmed") {
    changes.paymentStatus = "paid";
  } else if (newStatus === "cancelled") {
    changes.paymentStatus = "refunded";
  }

  saveStoredOverride(id, changes);

  if (demo) {
    return { success: true, status: newStatus };
  }

  try {
    return await request(UPDATE_PATH(id), {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
  } catch {
    return { success: true, status: newStatus, local: true };
  }
}

/** Cancel a booking and mark as refunded. */
export async function cancelAndRefundBooking(id, { demo = false } = {}) {
  const changes = {
    status: "cancelled",
    paymentStatus: "refunded",
  };
  saveStoredOverride(id, changes);

  if (demo) {
    return { success: true, ...changes };
  }

  try {
    return await request(UPDATE_PATH(id), {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
  } catch {
    return { success: true, ...changes, local: true };
  }
}

/** Edit any details of a booking. */
export async function updateBookingFields(id, fields, { demo = false } = {}) {
  saveStoredOverride(id, fields);

  if (demo) {
    return { success: true, ...fields };
  }

  try {
    return await request(UPDATE_PATH(id), {
      method: "PATCH",
      body: JSON.stringify(fields),
    });
  } catch {
    return { success: true, ...fields, local: true };
  }
}

/* ---------- Dashboard Calculation Helper ---------- */
export function calculateDashboardStats(bookings = []) {
  if (!bookings || bookings.length === 0) {
    return [
      { id: "visitors", label: "Total Visitors", value: "0", change: "+0%" },
      { id: "bookings", label: "Total Bookings", value: "0", change: "+0%" },
      { id: "revenue", label: "Revenue", value: "0 EGP", change: "+0%" },
    ];
  }

  // نحسب فقط الرحلات المؤكدة (Confirmed) وغير المسترجعة
  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed" && b.paymentStatus !== "refunded"
  );

  // Visitors: عدد الزوار الفريدين للرحلات المؤكدة
  const uniqueVisitors = new Set(
    confirmedBookings.map((b) => b.visitor.trim().toLowerCase())
  ).size;

  // Total Bookings: إجمالي عدد الرحلات المؤكدة
  const totalConfirmed = confirmedBookings.length;

  // Revenue: مجموع مبالغ الرحلات المؤكدة فقط
  const revenue = confirmedBookings.reduce(
    (sum, b) => sum + (Number(b.totalPrice) || 0),
    0
  );

  // مقارنة النصف الأول بالنصف الثاني لحساب نسبة التغيير
  const half = Math.floor(confirmedBookings.length / 2);
  const recent = confirmedBookings.slice(0, half);
  const older = confirmedBookings.slice(half);

  const recentRev = recent.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
  const olderRev = older.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);

  const pct = (r, o) => {
    if (o === 0) return r > 0 ? "+100%" : "+0%";
    const p = Math.round(((r - o) / o) * 100);
    return p >= 0 ? `+${p}%` : `${p}%`;
  };

  return [
    {
      id: "visitors",
      label: "Total Visitors",
      value: uniqueVisitors.toLocaleString(),
      change: pct(recent.length, older.length),
    },
    {
      id: "bookings",
      label: "Total Bookings",
      value: totalConfirmed.toLocaleString(),
      change: pct(recent.length, older.length),
    },
    {
      id: "revenue",
      label: "Revenue",
      value: `${revenue.toLocaleString()} EGP`,
      change: pct(recentRev, olderRev),
    },
  ];
}
