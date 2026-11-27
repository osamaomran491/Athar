// Bookings.jsx
// Route: /bookings  — "Booking Management" table
//  • tabs: All Booking / Museum Tickets / Robot Tours (persisted in URL across refresh)
//  • Filter By (name / type / date / time / status) · pagination
//  • Table Actions: View / Accept / Reject
//  • View Modal: Full details + Edit booking fields + Cancel & Refund option
//  • Export  -> downloads a PDF with ALL rows of the current tab
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  LuChevronLeft,
  LuChevronRight,
  LuCloudUpload,
  LuCircleCheck,
  LuClock3,
  LuCircleX,
  LuX,
} from "react-icons/lu";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getSession, logout } from "../services/authService";
import {
  fetchBookings,
  fetchBookingById,
  updateBookingStatus,
  cancelAndRefundBooking,
  updateBookingFields,
} from "../services/bookingService";
import { exportBookingsPdf } from "../utils/exportBookingsPdf";
import {
  formatDateTime,
  formatFullDate,
  formatId,
  humanizeKey,
  PAYMENT_LABELS,
  PAYMENT_METHODS,
  STATUS_LABELS,
} from "../utils/bookingFormat";

const PAGE_SIZE = 6;
const TABS = [
  { key: "all", label: "All Booking", match: () => true },
  { key: "museum", label: "Museum Tickets", match: (b) => b.type === "Museum" },
  { key: "robot", label: "Robot Tours", match: (b) => b.type === "Robot Tour" },
];
const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "visitor", label: "Visitor" },
  { key: "date", label: "Date & Time" },
  { key: "type", label: "Type" },
  { key: "paymentMethod", label: "Payment" },
  { key: "status", label: "Status" },
];
const EMPTY_FILTERS = { name: "", type: "all", date: "", timeFrom: "", timeTo: "", status: "all" };
const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "Museum", label: "Museum" },
  { value: "Robot Tour", label: "Robot Tour" },
];
const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];
const pad2 = (n) => String(n).padStart(2, "0");
const countActiveFilters = (f) =>
  [f.name.trim(), f.type !== "all", f.date, f.timeFrom || f.timeTo, f.status !== "all"].filter(Boolean).length;

function matchesFilters(b, f) {
  if (f.name.trim() && !String(b.visitor || "").trim().toLowerCase().startsWith(f.name.trim().toLowerCase())) return false;
  if (f.type !== "all" && b.type !== f.type) return false;
  if (f.status !== "all" && b.status !== f.status) return false;
  if (f.date || f.timeFrom || f.timeTo) {
    const d = new Date(b.date);
    if (Number.isNaN(d.getTime())) return false;
    if (f.date && `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` !== f.date) return false;
    const t = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    if (f.timeFrom && t < f.timeFrom) return false;
    if (f.timeTo && t > f.timeTo) return false;
  }
  return true;
}

const STATUS_ICON = { confirmed: LuCircleCheck, pending: LuClock3, cancelled: LuCircleX };

function StatusPill({ status }) {
  const Icon = STATUS_ICON[status] || LuClock3;
  return (
    <span className={`bk-pill bk-pill--${status}`}>
      <Icon className="bk-pill__icon" /> {STATUS_LABELS[status] || status}
    </span>
  );
}

/* ---------- Popup with Full Booking + Edit + Refund ---------- */
const HIDDEN_KEYS = ["__v", "password", "token", "raw"];
const isPrimitive = (v) => v === null || ["string", "number", "boolean"].includes(typeof v);

function DetailsModal({
  booking,
  loading,
  error,
  demo,
  onClose,
  onUpdateBooking,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    visitor: "",
    date: "",
    type: "Museum",
    status: "confirmed",
    paymentMethod: "",
    tickets: 1,
    totalPrice: 150,
    phone: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    if (booking) {
      setEditForm({
        visitor: booking.visitor || "",
        date: booking.date ? new Date(booking.date).toISOString().slice(0, 16) : "",
        type: booking.type || "Museum",
        status: booking.status || "confirmed",
        paymentMethod: booking.paymentMethod || "",
        tickets: booking.tickets || 1,
        totalPrice: booking.totalPrice || 150,
        phone: booking.phone || "",
        email: booking.email || "",
      });
    }
  }, [booking]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Handle Cancel & Refund
  const handleCancelAndRefund = async () => {
    if (!booking) return;
    const confirmRefund = window.confirm(
      `Are you sure you want to cancel booking #${booking.id} and refund ${booking.totalPrice} EGP to the customer?`
    );
    if (!confirmRefund) return;

    setSaving(true);
    setActionMsg("");
    try {
      await cancelAndRefundBooking(booking.id, { demo });
      const updated = {
        ...booking,
        status: "cancelled",
        paymentStatus: "refunded",
      };
      onUpdateBooking(updated);
      setActionMsg("Booking has been successfully cancelled and marked as refunded.");
    } catch (err) {
      alert("Failed to refund booking: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!booking) return;

    setSaving(true);
    setActionMsg("");
    try {
      const payload = {
        visitor: editForm.visitor.trim(),
        date: editForm.date ? new Date(editForm.date).toISOString() : booking.date,
        type: editForm.type,
        status: editForm.status,
        paymentMethod: editForm.paymentMethod || null,
        tickets: Number(editForm.tickets) || 1,
        totalPrice: Number(editForm.totalPrice) || 0,
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
      };
      await updateBookingFields(booking.id, payload, { demo });
      const updated = { ...booking, ...payload };
      onUpdateBooking(updated);
      setIsEditing(false);
      setActionMsg("Booking details updated successfully!");
    } catch (err) {
      alert("Failed to update booking: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const fields = useMemo(() => {
    if (!booking) return [];
    const out = [];
    const walk = (obj, prefix = "") => {
      Object.entries(obj || {}).forEach(([k, v]) => {
        if (HIDDEN_KEYS.includes(k)) return;
        const label = humanizeKey(prefix ? `${prefix} ${k}` : k);
        if (isPrimitive(v)) out.push([label, v === null || v === "" ? "—" : String(v)]);
        else if (Array.isArray(v)) out.push([label, v.map((x) => (isPrimitive(x) ? x : JSON.stringify(x))).join(", ") || "—"]);
        else if (!prefix) walk(v, k);
      });
    };
    walk(booking.raw || booking);
    return out;
  }, [booking]);

  const isRefunded = booking?.paymentStatus === "refunded" || booking?.status === "cancelled";

  return createPortal(
    <div className="bk-modal" role="dialog" aria-modal="true" aria-label="Booking details" onClick={onClose}>
      <div className="bk-modal__box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="bk-modal__close" onClick={onClose} aria-label="Close">
          <LuX />
        </button>

        {booking && (
          <header className="bk-modal__head">
            <div>
              <h2>Booking {formatId(booking.id)}</h2>
              <span className="bk-modal__subid">Visitor: {booking.visitor}</span>
            </div>
            <div className="bk-modal__pills">
              <StatusPill status={booking.status} />
              {booking.paymentStatus && (
                <span className={`bk-pill-pay bk-pill-pay--${booking.paymentStatus}`}>
                  {booking.paymentStatus.toUpperCase()}
                </span>
              )}
            </div>
          </header>
        )}

        {actionMsg && <div className="bk-modal__alert">{actionMsg}</div>}
        {loading && <p className="bk-modal__note">Loading booking details…</p>}
        {error && <p className="bk-modal__note bk-modal__note--err">{error}</p>}

        {booking && !isEditing && (
          <>
            {/* Action Bar inside View */}
            <div className="bk-modal__actions-bar">
              <button
                type="button"
                className="bk-btn bk-btn--edit"
                onClick={() => setIsEditing(true)}
              >
                ✎ Edit Details
              </button>

              {!isRefunded ? (
                <button
                  type="button"
                  className="bk-btn bk-btn--refund"
                  disabled={saving}
                  onClick={handleCancelAndRefund}
                >
                  ✕ Cancel &amp; Refund ({booking.totalPrice} EGP)
                </button>
              ) : (
                <span className="bk-refunded-badge">✓ Cancelled &amp; Refunded</span>
              )}
            </div>

            <div className="bk-modal__summary">
              <div><span>Visitor</span><b>{booking.visitor}</b></div>
              <div><span>Date &amp; Time</span><b>{formatFullDate(booking.date)}</b></div>
              <div><span>Type</span><b>{booking.type}</b></div>
              <div><span>Tickets</span><b>{booking.tickets} ticket(s)</b></div>
              <div><span>Total Amount</span><b>{booking.totalPrice} EGP</b></div>
              <div><span>Payment Method</span><b>{PAYMENT_LABELS[booking.paymentMethod] || "—"}</b></div>
              <div><span>Payment</span><b style={{ textTransform: "capitalize" }}>{booking.paymentStatus || "Paid"}</b></div>
            </div>

            <h3 className="bk-modal__sub">All booking information</h3>
            <dl className="bk-modal__grid">
              <div key="phone"><dt>Phone Number</dt><dd>{booking.phone || "—"}</dd></div>
              <div key="email"><dt>Email Address</dt><dd>{booking.email || "—"}</dd></div>
              {fields.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </>
        )}

        {/* Edit Form Mode */}
        {booking && isEditing && (
          <form className="bk-edit-form" onSubmit={handleSaveEdit}>
            <h3 className="bk-modal__sub" style={{ marginTop: "12px" }}>Edit Booking Details</h3>
            
            <div className="bk-form-grid">
              <label className="bk-field">
                <span>Visitor Name</span>
                <input
                  type="text"
                  required
                  value={editForm.visitor}
                  onChange={(e) => setEditForm({ ...editForm, visitor: e.target.value })}
                />
              </label>

              <label className="bk-field">
                <span>Date &amp; Time</span>
                <input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
              </label>

              <label className="bk-field">
                <span>Tour / Booking Type</span>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                >
                  <option value="Museum">Museum</option>
                  <option value="Robot Tour">Robot Tour</option>
                </select>
              </label>

              <label className="bk-field">
                <span>Status</span>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="bk-field">
                <span>Payment Method</span>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                >
                  <option value="">Not set</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>

              <label className="bk-field">
                <span>Tickets Count</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editForm.tickets}
                  onChange={(e) => setEditForm({ ...editForm, tickets: e.target.value })}
                />
              </label>

              <label className="bk-field">
                <span>Total Price (EGP)</span>
                <input
                  type="number"
                  min="0"
                  value={editForm.totalPrice}
                  onChange={(e) => setEditForm({ ...editForm, totalPrice: e.target.value })}
                />
              </label>

              <label className="bk-field">
                <span>Visitor Phone</span>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </label>

              <label className="bk-field">
                <span>Visitor Email</span>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </label>
            </div>

            <div className="bk-form-buttons">
              <button
                type="button"
                className="bk-btn bk-btn--cancel"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bk-btn bk-btn--save"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ---------- Filter By (popover) ---------- */
function FilterMenu({ filters, onChange, onReset, total, shown }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const active = countActiveFilters(filters);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="bk-filter" ref={wrapRef}>
      <button
        type="button"
        className={`bk-btn bk-filter__btn ${active ? "bk-filter__btn--on" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
        Filter By
        {active > 0 && <span className="bk-filter__count">{active}</span>}
      </button>

      {open && (
        <div className="bk-filter__panel" role="dialog" aria-label="Filter bookings">
          <label className="bk-field">
            <span>Name starts with</span>
            <input type="text" placeholder="e.g. S or Sar" value={filters.name} onChange={set("name")} />
          </label>

          <label className="bk-field">
            <span>Ticket type</span>
            <select value={filters.type} onChange={set("type")}>
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className="bk-field">
            <span>Date</span>
            <input type="date" value={filters.date} onChange={set("date")} />
          </label>

          <div className="bk-field">
            <span>Time</span>
            <div className="bk-filter__time">
              <input type="time" aria-label="From time" value={filters.timeFrom} onChange={set("timeFrom")} />
              <em>to</em>
              <input type="time" aria-label="To time" value={filters.timeTo} onChange={set("timeTo")} />
            </div>
          </div>

          <label className="bk-field">
            <span>Status</span>
            <select value={filters.status} onChange={set("status")}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <div className="bk-filter__foot">
            <span className="bk-filter__result">{shown} of {total} bookings</span>
            <button type="button" className="bk-btn bk-btn--cancel" onClick={onReset} disabled={!active}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Confirm Quick Action Modal ---------- */
function ConfirmModal({ action, bookingId, onConfirm, onCancel }) {
  const isAccept = action === "accept";
  return createPortal(
    <div className="bk-modal" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="bk-confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className={`bk-confirm-icon ${isAccept ? "bk-confirm-icon--accept" : "bk-confirm-icon--reject"}`}>
          {isAccept ? <LuCircleCheck /> : <LuCircleX />}
        </div>
        <h3 className="bk-confirm-title">
          {isAccept ? "Accept Booking" : "Reject Booking"}
        </h3>
        <p className="bk-confirm-text">
          Are you sure you want to {isAccept ? "accept" : "reject"} booking <b>{formatId(bookingId)}</b>?
          {!isAccept && " This action will cancel the booking."}
        </p>
        <div className="bk-confirm-actions">
          <button type="button" className="bk-btn bk-btn--cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className={`bk-btn ${isAccept ? "bk-btn--accept" : "bk-btn--reject"}`} onClick={onConfirm}>
            {isAccept ? "Accept" : "Reject"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Bookings() {
  const session = getSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [demo, setDemo] = useState(false);
  const [state, setState] = useState("loading");
  const [page, setPage] = useState(1);
  const [details, setDetails] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Tab persisted in URL query param so refresh preserves the view
  const tab = searchParams.get("tab") || "all";
  const changeTab = useCallback(
    (key) => {
      setSearchParams({ tab: key }, { replace: true });
      setPage(1);
    },
    [setSearchParams]
  );

  const loadData = useCallback(() => {
    fetchBookings()
      .then(({ list, demo: isDemo }) => {
        setBookings(list);
        setDemo(isDemo);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    loadData();
    const handleStorageSync = () => loadData();
    window.addEventListener("athar_bookings_updated", handleStorageSync);
    return () => window.removeEventListener("athar_bookings_updated", handleStorageSync);
  }, [loadData]);

  const rows = useMemo(() => {
    const tabDef = TABS.find((t) => t.key === tab) || TABS[0];
    const list = bookings.filter((b) => tabDef.match(b) && matchesFilters(b, filters));
    return list;
  }, [bookings, tab, filters]);

  const tabTotal = useMemo(() => {
    const tabDef = TABS.find((t) => t.key === tab) || TABS[0];
    return bookings.filter(tabDef.match).length;
  }, [bookings, tab]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  if (!session) return <Navigate to="/login" replace />;
  const handleLogout = () => {
    logout();
    window.location.assign(`${import.meta.env.BASE_URL}login`);
  };

  const changeFilters = (next) => {
    setFilters(next);
    setPage(1);
  };

  const openDetails = async (row) => {
    setDetails({ booking: row, loading: true, error: "" });
    try {
      const full = await fetchBookingById(row.id, { demo, fallback: row });
      setDetails({ booking: full || row, loading: false, error: "" });
    } catch {
      setDetails({
        booking: row,
        loading: false,
        error: "Couldn't load full details from server. Showing current data.",
      });
    }
  };

  // Quick Accept / Reject from table
  const handleQuickStatus = async (bookingId, action) => {
    const newStatus = action === "accept" ? "confirmed" : "cancelled";
    setUpdating(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus, { demo });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      alert(`Failed to update booking: ${err.message}`);
    } finally {
      setUpdating(null);
      setConfirmAction(null);
    }
  };

  // Called when modal updates a booking
  const handleModalBookingUpdate = (updatedBooking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
    setDetails((prev) => (prev ? { ...prev, booking: updatedBooking } : null));
  };

  return (
    <DashboardLayout
      userName={session.name || "Admin"}
      userPicture={session.picture}
      onLogout={handleLogout}
    >
      <div className="bk">
        <header className="bk__head reveal" style={{ "--i": 0 }}>
          <h1 className="bk__title">Booking Management</h1>
          {demo && <p className="bk__demo">Demo data — changes are saved locally.</p>}
        </header>

        {/* Tabs Filter */}
        <div className="bk__tabs reveal" style={{ "--i": 1 }} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`bk-tab ${tab === t.key ? "bk-tab--active" : ""}`}
              onClick={() => changeTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filter By */}
        <div className="bk__toolbar reveal" style={{ "--i": 2 }}>
          <FilterMenu
            filters={filters}
            onChange={changeFilters}
            onReset={() => changeFilters(EMPTY_FILTERS)}
            total={tabTotal}
            shown={rows.length}
          />
        </div>

        {/* Bookings Table */}
        <section className="bk-card reveal" style={{ "--i": 3 }}>
          <div className="bk-card__scroll">
            <table className="bk-table">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state === "loading" && (
                  <tr>
                    <td colSpan={7} className="bk-empty">
                      Loading bookings…
                    </td>
                  </tr>
                )}
                {state === "error" && (
                  <tr>
                    <td colSpan={7} className="bk-empty bk-empty--err">
                      Couldn't load bookings. Please try again.
                    </td>
                  </tr>
                )}
                {state === "ready" && visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="bk-empty">
                      {countActiveFilters(filters) ? "No bookings match the selected filters." : "No bookings found."}
                    </td>
                  </tr>
                )}
                {state === "ready" &&
                  visible.map((b) => (
                    <tr key={b.id}>
                      <td>{formatId(b.id)}</td>
                      <td>{b.visitor}</td>
                      <td>{formatDateTime(b.date)}</td>
                      <td>{b.type}</td>
                      <td>{PAYMENT_LABELS[b.paymentMethod] || "—"}</td>
                      <td>
                        <StatusPill status={b.status} />
                      </td>
                      <td>
                        <div className="bk-actions">
                          <button
                            type="button"
                            className="bk-btn bk-btn--view"
                            onClick={() => openDetails(b)}
                          >
                            View
                          </button>

                          {b.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="bk-btn bk-btn--accept"
                                disabled={updating === b.id}
                                onClick={() =>
                                  setConfirmAction({ action: "accept", bookingId: b.id })
                                }
                                title="Accept booking"
                              >
                                <LuCircleCheck /> Accept
                              </button>
                              <button
                                type="button"
                                className="bk-btn bk-btn--reject"
                                disabled={updating === b.id}
                                onClick={() =>
                                  setConfirmAction({ action: "reject", bookingId: b.id })
                                }
                                title="Reject booking"
                              >
                                <LuCircleX /> Reject
                              </button>
                            </>
                          )}

                          {b.status === "confirmed" && (
                            <button
                              type="button"
                              className="bk-btn bk-btn--reject"
                              disabled={updating === b.id}
                              onClick={() =>
                                setConfirmAction({ action: "reject", bookingId: b.id })
                              }
                              title="Cancel booking"
                            >
                              <LuCircleX /> Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer with Pagination and Export */}
        <footer className="bk__foot reveal" style={{ "--i": 4 }}>
          <nav className="bk-pager" aria-label="Pagination">
            <button
              type="button"
              className="bk-page"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              aria-label="Previous page"
            >
              <LuChevronLeft />
            </button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const start = Math.min(Math.max(1, current - 2), Math.max(1, pages - 4));
              const n = start + i;
              return (
                <button
                  key={n}
                  type="button"
                  className={`bk-page ${n === current ? "bk-page--active" : ""}`}
                  aria-current={n === current ? "page" : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              );
            })}
            <button
              type="button"
              className="bk-page"
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
              aria-label="Next page"
            >
              <LuChevronRight />
            </button>
          </nav>

          <button
            type="button"
            className="bk-btn bk-btn--export"
            disabled={state !== "ready" || rows.length === 0}
            onClick={() =>
              exportBookingsPdf(rows, {
                filterLabel: TABS.find((t) => t.key === tab).label + (countActiveFilters(filters) ? " (filtered)" : ""),
              })
            }
          >
            <LuCloudUpload /> Export
          </button>
        </footer>
      </div>

      {details && (
        <DetailsModal
          {...details}
          demo={demo}
          onClose={() => setDetails(null)}
          onUpdateBooking={handleModalBookingUpdate}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction.action}
          bookingId={confirmAction.bookingId}
          onConfirm={() =>
            handleQuickStatus(confirmAction.bookingId, confirmAction.action)
          }
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </DashboardLayout>
  );
}