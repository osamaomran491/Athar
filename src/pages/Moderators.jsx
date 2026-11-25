// Moderators.jsx
// Route: /moderators  — OWNER ONLY (the sidebar link is hidden and the route redirects for anyone else)
//  • lists the people who are allowed to sign in to the dashboard
//  • Add Member (name / email / password) · Edit · Enable / Disable · Remove
//  • same look as the Bookings page (bk-* classes), extra styles live in moderators.css
// Real protection must also exist on the backend: see docs/MODERATORS_API.md
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate } from "react-router-dom";
import {
  LuChevronLeft,
  LuChevronRight,
  LuCircleCheck,
  LuCircleX,
  LuEye,
  LuEyeOff,
  LuPencil,
  LuUserPlus,
  LuX,
} from "react-icons/lu";
import DashboardLayout from "../components/layout/DashboardLayout";
import PasswordChecklist from "../components/ui/PasswordChecklist";
import { getSession, isOwner, logout } from "../services/authService";
import {
  addModerator,
  fetchModerators,
  getDemoPermissions,
  ModeratorError,
  removeModerator,
  updateModerator,
} from "../services/moderatorService";
import { DASHBOARD_PAGES } from "../utils/permissions";
import { isEmailValid, isPasswordValid } from "../utils/validators";

const PAGE_SIZE = 6;
const COLUMNS = ["Member", "Email", "Password", "Added", "Status", "Actions"];

const formatAdded = (iso) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const initials = (name) =>
  String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

function StatusPill({ active }) {
  const Icon = active ? LuCircleCheck : LuCircleX;
  return (
    <span className={`bk-pill ${active ? "bk-pill--confirmed" : "bk-pill--cancelled"}`}>
      <Icon className="bk-pill__icon" /> {active ? "Active" : "Disabled"}
    </span>
  );
}

/** Shared Esc-to-close + scroll lock for the popups */
function useModalBehavior(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
}
/* ---------- Add / Edit popup ---------- */
function MemberModal({ member, demo, onClose, onSaved }) {
  const editing = !!member;
  const [form, setForm] = useState({
    name: member?.name || "",
    email: member?.email || "",
    password: "",
    permissions: member?.permissions ?? getDemoPermissions(member?.email) ?? DASHBOARD_PAGES.map((p) => p.key),
  });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  useModalBehavior(onClose);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
    setFormError("");
  };
  const togglePage = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((k) => k !== key)
        : [...f.permissions, key],
    }));
    setErrors((er) => ({ ...er, permissions: "" }));
  };

  const validate = () => {
    const found = {};
    if (form.name.trim().length < 2) found.name = "Enter the member's name";
    if (!isEmailValid(form.email.trim())) found.email = "Enter a valid email";
    // on edit the password is optional (empty = keep the old one)
    if ((!editing || form.password) && !isPasswordValid(form.password)) {
      found.password = "Password doesn't meet the rules below";
    }
    if (form.permissions.length === 0) found.permissions = "Select at least one page";
    return found;
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await updateModerator(member.id, form, { demo, email: member.email });
      } else {
        await addModerator(form, { demo });
      }
      onSaved(editing ? "Member updated." : "Member added. They can now sign in to the dashboard.");
    } catch (err) {
      if (err instanceof ModeratorError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err.message || "Something went wrong. Please try again");
      setSaving(false);
    }
  };

  return createPortal(
    <div className="bk-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit member" : "Add member"} onClick={onClose}>
      <div className="bk-modal__box mod-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="bk-modal__close" onClick={onClose} aria-label="Close">
          <LuX />
        </button>

        <h2 className="mod-box__title">{editing ? "Edit Member" : "Add Member"}</h2>
        <p className="mod-box__hint">
          {editing
            ? "Change the details below. Leave the password empty to keep the current one."
            : "This person will be able to sign in to the dashboard with these details."}
        </p>

        <form className="bk-edit-form" onSubmit={submit} noValidate autoComplete="off">
          <div className="mod-form">
            <label className="bk-field">
              <span>Full name</span>
              <input type="text" value={form.name} onChange={set("name")} autoFocus />
              {errors.name && <em className="mod-err">{errors.name}</em>}
            </label>

            <label className="bk-field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={set("email")} autoComplete="off" />
              {errors.email && <em className="mod-err">{errors.email}</em>}
            </label>

            <label className="bk-field">
              <span>{editing ? "New password (optional)" : "Password"}</span>
              <div className="mod-pass">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="mod-pass__eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <LuEyeOff /> : <LuEye />}
                </button>
              </div>
              {errors.password && <em className="mod-err">{errors.password}</em>}
            </label>
            <PasswordChecklist password={form.password} />
            <div className="mod-permissions">
              <span>Pages Access</span>
              <div className="mod-perm-grid">
                {DASHBOARD_PAGES.map((page) => (
                  <label key={page.key} className="mod-perm-item">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(page.key)}
                      onChange={() => togglePage(page.key)}
                    />
                    {page.label}
                  </label>
                ))}
              </div>
              {errors.permissions && <em className="mod-err">{errors.permissions}</em>}
            </div>
          </div>

          {formError && <p className="bk-modal__note bk-modal__note--err" role="alert">{formError}</p>}

          <div className="bk-form-buttons">
            <button type="button" className="bk-btn bk-btn--cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="bk-btn bk-btn--save" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Confirm popup (Remove / Disable / Enable) ---------- */
const CONFIRM_TEXT = {
  remove: {
    title: "Remove Member",
    body: (m) => <>Remove <b>{m.name}</b>? They will lose access to the dashboard right away.</>,
    button: "Remove",
    danger: true,
  },
  disable: {
    title: "Disable Member",
    body: (m) => <>Disable <b>{m.name}</b>? They can't sign in until you enable them again.</>,
    button: "Disable",
    danger: true,
  },
  enable: {
    title: "Enable Member",
    body: (m) => <>Give <b>{m.name}</b> access to the dashboard again?</>,
    button: "Enable",
    danger: false,
  },
};

function ConfirmModal({ action, member, busy, onConfirm, onCancel }) {
  const t = CONFIRM_TEXT[action];
  useModalBehavior(onCancel);
  return createPortal(
    <div className="bk-modal" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="bk-confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className={`bk-confirm-icon ${t.danger ? "bk-confirm-icon--reject" : "bk-confirm-icon--accept"}`}>
          {t.danger ? <LuCircleX /> : <LuCircleCheck />}
        </div>
        <h3 className="bk-confirm-title">{t.title}</h3>
        <p className="bk-confirm-text">{t.body(member)}</p>
        <div className="bk-confirm-actions">
          <button type="button" className="bk-btn bk-btn--cancel" onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            type="button"
            className={`bk-btn ${t.danger ? "bk-btn--reject" : "bk-btn--accept"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "…" : t.button}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Moderators() {
  const session = getSession();
  const owner = isOwner(session);

  const [members, setMembers] = useState([]);
  const [demo, setDemo] = useState(false);
  const [state, setState] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: "form", member? } | { type: "confirm", action, member }
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    fetchModerators()
      .then(({ list, demo: isDemo }) => {
        setMembers(list);
        setDemo(isDemo);
        setState("ready");
      })
      .catch((err) => {
        setLoadError(
          err.status === 401 || err.status === 403
            ? "You don't have permission to manage moderators."
            : "Couldn't load moderators. Please try again."
        );
        setState("error");
      });
  }, []);

  useEffect(() => {
    if (owner) load();
  }, [owner, load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const pages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = useMemo(
    () => members.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [members, current]
  );

  if (!session) return <Navigate to="/login" replace />;
  if (!owner) return <Navigate to="/dashboard" replace />;

  const handleLogout = () => {
    logout();
    window.location.assign(`${import.meta.env.BASE_URL}login`);
  };

  const onSaved = (message) => {
    setModal(null);
    setToast(message);
    load();
  };

  const runConfirm = async () => {
    const { action, member } = modal;
    setBusy(true);
    try {
      if (action === "remove") await removeModerator(member.id, { demo, email: member.email });
      else await updateModerator(member.id, { active: action === "enable" }, { demo, email: member.email });
      setToast(
        action === "remove" ? "Member removed." : action === "enable" ? "Member enabled." : "Member disabled."
      );
      setModal(null);
      load();
    } catch (err) {
      setToast(err.message || "Something went wrong. Please try again");
      setModal(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout userName={session.name || "Admin"} userPicture={session.picture} onLogout={handleLogout}>
      <div className="bk mod">
        <header className="bk__head mod__head reveal" style={{ "--i": 0 }}>
          <div>
            <h1 className="bk__title">Moderators</h1>
            <p className="mod__sub">People who can sign in to the dashboard. Only you can see this page.</p>
            {demo && (
              <p className="bk__demo">Backend not connected yet — demo data, saved on this browser only (passwords are not stored).</p>
            )}
          </div>
          <button type="button" className="bk-btn bk-btn--save mod__add" onClick={() => setModal({ type: "form" })} disabled={state === "error"}>
            <LuUserPlus /> Add Member
          </button>
        </header>

        {toast && <div className="bk-modal__alert mod__toast" role="status">{toast}</div>}

        <section className="bk-card reveal" style={{ "--i": 1 }}>
          <div className="bk-card__scroll">
            <table className="bk-table mod-table">
              <thead>
                <tr>{COLUMNS.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {state === "loading" && (
                  <tr><td colSpan={6} className="bk-empty">Loading moderators…</td></tr>
                )}
                {state === "error" && (
                  <tr><td colSpan={6} className="bk-empty bk-empty--err">{loadError}</td></tr>
                )}
                {state === "ready" && visible.length === 0 && (
                  <tr><td colSpan={6} className="bk-empty">No members yet. Press “Add Member” to give someone access.</td></tr>
                )}
                {state === "ready" &&
                  visible.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="mod-who">
                          <span className="mod-who__avatar" aria-hidden="true">{initials(m.name)}</span>
                          <span className="mod-who__name">{m.name}</span>
                        </div>
                      </td>
                      <td className="mod-email">{m.email}</td>
                      <td><span className="mod-mask" title="Passwords are stored hashed and can't be shown">••••••••</span></td>
                      <td>{formatAdded(m.createdAt)}</td>
                      <td><StatusPill active={m.active} /></td>
                      <td>
                        <div className="bk-actions">
                          <button type="button" className="bk-btn bk-btn--view" onClick={() => setModal({ type: "form", member: m })}>
                            <LuPencil /> Edit
                          </button>
                          <button
                            type="button"
                            className={`bk-btn bk-btn--view ${m.active ? "" : "bk-btn--accept"}`}
                            onClick={() => setModal({ type: "confirm", action: m.active ? "disable" : "enable", member: m })}
                          >
                            {m.active ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            className="bk-btn bk-btn--reject"
                            onClick={() => setModal({ type: "confirm", action: "remove", member: m })}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {state === "ready" && pages > 1 && (
          <footer className="bk__foot reveal" style={{ "--i": 2 }}>
            <nav className="bk-pager" aria-label="Pagination">
              <button type="button" className="bk-page" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
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
              <button type="button" className="bk-page" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page">
                <LuChevronRight />
              </button>
            </nav>
          </footer>
        )}
      </div>

      {modal?.type === "form" && (
        <MemberModal member={modal.member} demo={demo} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
      {modal?.type === "confirm" && (
        <ConfirmModal
          action={modal.action}
          member={modal.member}
          busy={busy}
          onConfirm={runConfirm}
          onCancel={() => !busy && setModal(null)}
        />
      )}
    </DashboardLayout>
  );
}
