// moderatorService.js
// Talks to the backend for the Moderators page (people allowed to sign in to the dashboard).
//
// Endpoints expected from the backend (all of them owner-only, see docs/BACKEND_MODERATORS_GUIDE.md):
//   GET    /api/moderators          -> list
//   POST   /api/moderators          -> add      { name, email, password, permissions }
//   PATCH  /api/moderators/:id      -> edit     { name?, email?, password?, active?, permissions? }
//   DELETE /api/moderators/:id      -> remove access
//
// While the backend is not ready (network error / 404), the page runs in demo mode:
// data is kept in localStorage and the password is NOT stored at all.
import { getToken } from "./authService";
import {
  DEMO_MODS_KEY,
  getLocalPermissions,
  normalizeEmail,
  removeLocalPermissions,
  saveLocalPermissions,
  setLocalModeratorActive,
} from "../utils/permissions";

const API_URL = import.meta.env.VITE_API_URL || "";
const BASE = "/api/moderators";

export { getLocalPermissions as getDemoPermissions };

export class ModeratorError extends Error {
  constructor(message, { field = null, status = 0 } = {}) {
    super(message);
    this.field = field;
    this.status = status;
  }
}

/* ---------- request ---------- */
async function request(path = "", options = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_URL}${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ModeratorError("Can't reach the server", { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ModeratorError(data.message || `Request failed (${res.status})`, {
      status: res.status,
      field: data.field || null,
    });
  }
  return data;
}

/** Only these mean "the backend isn't there yet" -> use demo mode. 401/403/409... are real answers. */
const backendMissing = (err) => err instanceof ModeratorError && [0, 404, 501].includes(err.status);

/* ---------- normalize ---------- */
const pick = (obj, keys) => {
  for (const k of keys) if (obj?.[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  return null;
};

export function normalizeModerator(raw = {}) {
  const status = String(pick(raw, ["status"]) || "").toLowerCase();
  const active = raw.active ?? raw.isActive ?? (status ? status === "active" : true);
  return {
    id: String(pick(raw, ["id", "_id", "userId"]) ?? normalizeEmail(raw.email)),
    name: pick(raw, ["name", "fullName"]) || "—",
    email: normalizeEmail(raw.email),
    role: pick(raw, ["role"]) || "moderator",
    active: !!active,
    permissions: Array.isArray(raw.permissions) ? raw.permissions : null,
    createdAt: pick(raw, ["createdAt", "created_at", "addedAt"]),
    lastLogin: pick(raw, ["lastLogin", "last_login", "lastLoginAt"]),
  };
}

const toList = (data) => {
  const list = Array.isArray(data) ? data : data.moderators || data.users || data.data || data.items || [];
  return Array.isArray(list) ? list : [];
};

/* ---------- demo storage (no passwords) ---------- */
const readDemo = () => {
  try { return JSON.parse(localStorage.getItem(DEMO_MODS_KEY)) || []; } catch { return []; }
};
const writeDemo = (list) => localStorage.setItem(DEMO_MODS_KEY, JSON.stringify(list));

/* ---------- public API ---------- */
export async function fetchModerators() {
  try {
    const list = toList(await request()).map(normalizeModerator);
    list.forEach((m) => saveLocalPermissions(m.email, m.permissions, m.active));
    return { list, demo: false };
  } catch (err) {
    if (!backendMissing(err)) throw err;
    return { list: readDemo().map(normalizeModerator), demo: true };
  }
}

export async function addModerator({ name, email, password, permissions }, { demo = false } = {}) {
  const cleanEmail = normalizeEmail(email);
  const payload = {
    name: name.trim(),
    email: cleanEmail,
    password,
    ...(Array.isArray(permissions) ? { permissions } : {}),
  };

  if (demo) {
    const list = readDemo();
    if (list.some((m) => normalizeEmail(m.email) === cleanEmail)) {
      throw new ModeratorError("This email already has access", { field: "email" });
    }
    const created = {
      id: `demo-${Date.now()}`,
      name: payload.name,
      email: cleanEmail,
      active: true,
      permissions: payload.permissions ?? null,
      createdAt: new Date().toISOString(),
    };
    writeDemo([created, ...list]);
    saveLocalPermissions(cleanEmail, payload.permissions, true);
    return normalizeModerator(created);
  }

  const data = await request("", { method: "POST", body: JSON.stringify(payload) });
  saveLocalPermissions(cleanEmail, payload.permissions, true);
  return normalizeModerator(data.moderator || data.user || data.data || { ...payload, password: undefined });
}

/** changes can hold name / email / password / active / permissions. An empty password is dropped (= keep the old one). */
export async function updateModerator(id, changes, { demo = false, email: knownEmail = null } = {}) {
  const body = { ...changes };
  if (body.email !== undefined) body.email = normalizeEmail(body.email);
  if (body.name !== undefined) body.name = body.name.trim();
  if (!body.password) delete body.password;

  const targetEmail = body.email || normalizeEmail(knownEmail);

  if (demo) {
    delete body.password;
    const list = readDemo();
    if (body.email && list.some((m) => m.id !== id && normalizeEmail(m.email) === body.email)) {
      throw new ModeratorError("This email already has access", { field: "email" });
    }
    const existing = list.find((m) => m.id === id);
    const oldEmail = normalizeEmail(existing?.email || knownEmail);
    writeDemo(list.map((m) => (m.id === id ? { ...m, ...body } : m)));
    if (oldEmail && body.email && oldEmail !== body.email) removeLocalPermissions(oldEmail);
    if (targetEmail) {
      if (Array.isArray(body.permissions)) saveLocalPermissions(targetEmail, body.permissions, body.active ?? existing?.active ?? true);
      else if (body.active !== undefined) setLocalModeratorActive(targetEmail, body.active);
    }
    return;
  }

  await request(`/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
  if (targetEmail) {
    if (Array.isArray(body.permissions)) saveLocalPermissions(targetEmail, body.permissions, body.active ?? true);
    else if (body.active !== undefined) setLocalModeratorActive(targetEmail, body.active);
  }
}

export async function removeModerator(id, { demo = false, email: knownEmail = null } = {}) {
  const list = readDemo();
  const existing = list.find((m) => m.id === id);
  const targetEmail = normalizeEmail(knownEmail || existing?.email);

  if (demo) {
    writeDemo(list.filter((m) => m.id !== id));
    if (targetEmail) removeLocalPermissions(targetEmail);
    return;
  }

  await request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (targetEmail) removeLocalPermissions(targetEmail);
}
