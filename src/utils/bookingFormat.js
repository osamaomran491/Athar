// bookingFormat.js — small helpers shared by the Bookings page and the PDF export.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct 16, 10:00AM" (like the design) */
export function formatDateTime(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return value ? String(value) : "—";
  const h = d.getHours();
  const h12 = h % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${h12}:${mm}${h >= 12 ? "PM" : "AM"}`;
}

/** Full date for the View popup: "Oct 16, 2026 · 10:00AM" */
export function formatFullDate(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return value ? String(value) : "—";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${formatDateTime(value).split(", ")[1]}`;
}

/** Booking ID — plain number, no prefix. */
export const formatId = (id) => `${id}`;

/** Payment methods a visitor can choose. */
export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "visa", label: "Visa" },
  { value: "wallet", label: "Wallet" },
  { value: "apple_pay", label: "Apple Pay" },
];
export const PAYMENT_LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));

export const STATUS_LABELS = { confirmed: "Confirmed", pending: "Pending", cancelled: "Cancelled" };

/** "createdAt" -> "Created At" */
export const humanizeKey = (key) =>
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase()).replace(/\bId\b/, "ID");