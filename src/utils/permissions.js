// Central helpers for dashboard access, page keys, and local fallback permissions.

export const PERMS_KEY = "Athar_perms";
export const DEMO_MODS_KEY = "Athar_moderators_demo";
export const USER_WEB_URL =
  import.meta.env.VITE_USER_WEB_URL ||
  "https://clarafahem-cell.github.io/athar-museums/?page=museums";

export const DASHBOARD_PAGES = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard" },
  { key: "museums", label: "Museums", path: "/museums" },
  { key: "artifacts", label: "Artifacts", path: "/artifacts" },
  { key: "robots", label: "Robots", path: "/robots" },
  { key: "bookings", label: "Bookings", path: "/bookings" },
  { key: "setting", label: "Setting", path: "/setting" },
];

export const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

function readPermsMap() {
  try {
    const raw = JSON.parse(localStorage.getItem(PERMS_KEY) || "{}");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function writePermsMap(map) {
  try {
    localStorage.setItem(PERMS_KEY, JSON.stringify(map));
  } catch {}
}

function readDemoList() {
  try {
    const list = JSON.parse(localStorage.getItem(DEMO_MODS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Save or update a moderator's local permissions and active flag (used while backend is not connected). */
export function saveLocalPermissions(email, permissions, active = true) {
  const key = normalizeEmail(email);
  if (!key) return;
  const map = readPermsMap();
  const prev = map[key];
  const prevPerms = Array.isArray(prev) ? prev : prev?.permissions;
  map[key] = {
    permissions: Array.isArray(permissions) ? permissions : prevPerms ?? null,
    active: active !== false,
  };
  writePermsMap(map);
}

export function setLocalModeratorActive(email, active) {
  const key = normalizeEmail(email);
  if (!key) return;
  const map = readPermsMap();
  const prev = map[key];
  const prevPerms = Array.isArray(prev) ? prev : prev?.permissions ?? null;
  map[key] = { permissions: prevPerms, active: !!active };
  writePermsMap(map);
}

export function removeLocalPermissions(email) {
  const key = normalizeEmail(email);
  if (!key) return;
  const map = readPermsMap();
  delete map[key];
  writePermsMap(map);
}

export function getLocalPermissions(email) {
  const key = normalizeEmail(email);
  if (!key) return null;
  const entry = readPermsMap()[key];
  if (Array.isArray(entry)) return entry;
  if (entry && Array.isArray(entry.permissions)) return entry.permissions;

  const demoMod = readDemoList().find((m) => normalizeEmail(m.email) === key);
  return Array.isArray(demoMod?.permissions) ? demoMod.permissions : null;
}

/** Checks if an email was granted active moderator access locally in this browser. */
export function isLocalActiveModerator(email) {
  const key = normalizeEmail(email);
  if (!key) return false;
  const demoMod = readDemoList().find((m) => normalizeEmail(m.email) === key);
  if (demoMod) return demoMod.active !== false;

  const entry = readPermsMap()[key];
  if (!entry) return false;
  return Array.isArray(entry) ? true : entry.active !== false;
}

export function getEffectivePermissions(session, owner) {
  if (owner) return null;
  if (Array.isArray(session?.permissions)) return session.permissions;
  return getLocalPermissions(session?.email);
}

export function canAccessPage(session, pageKey, owner) {
  if (!session) return false;
  if (pageKey === "moderators") return !!owner;
  if (owner) return true;
  const perms = getEffectivePermissions(session, false);
  if (!perms) return true;
  return perms.includes(pageKey);
}

export function getDefaultRoute(session, owner) {
  if (!session) return "/login";
  if (owner) return "/dashboard";
  const allowed = DASHBOARD_PAGES.find((p) => canAccessPage(session, p.key, false));
  return allowed ? allowed.path : null;
}
