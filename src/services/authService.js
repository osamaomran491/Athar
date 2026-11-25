import {
  USER_WEB_URL,
  canAccessPage as checkPageAccess,
  getDefaultRoute as resolveDefaultRoute,
  isLocalActiveModerator,
  normalizeEmail,
} from "../utils/permissions";

const USERS_KEY = "Athar_users";
const SESSION_KEY = "Athar_session";
const RESET_KEY = "Athar_reset_state";
const RESET_TTL = 10 * 60 * 1000; // بعد ما الكود يتأكد، عنده 10 دقايق يغيّر الباسورد

export { USER_WEB_URL };

export class AuthError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

const API_URL = import.meta.env.VITE_API_URL || "";

/** بيبعت طلب للـ API، ولو السيرفر رد بخطأ بيحوّله لـ AuthError */
async function api(path, { field = "email", ...options } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...options.headers,
      },
    });
  } catch {
    throw new AuthError(field, "Can't reach the server. Please try again");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(field, data.message || "Something went wrong");
  return data;
}

/* ---------- helpers ---------- */
const readUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
};
const writeUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

function saveSession(user, remember = true) {
  const session = {
    name: user.name,
    email: user.email,
    picture: user.picture || null,
    provider: user.provider,
    token: user.token || null,
    role: user.role || null,
    active: user.active ?? true,
    permissions: Array.isArray(user.permissions) ? user.permissions : null,
  };
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/* ---------- public API ---------- */
export async function registerUser({ name, email, password }) {
  await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: name.trim(), email: normalizeEmail(email), password }),
    field: "email",
  });
}

export async function loginUser({ email, password, remember }) {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email), password }),
    field: "password",
  });
  return saveSession(
    {
      name: data.user.name,
      email: data.user.email,
      provider: "password",
      token: data.token,
      role: data.user.role,
      active: data.user.active,
      permissions: data.user.permissions ?? null,
    },
    remember
  );
}

/** profile = { name, email, picture }  */
export async function loginWithGoogle(profile) {
  const users = readUsers();
  const key = normalizeEmail(profile.email);
  let user = users.find((u) => u.email === key);
  if (!user) {
    user = { name: profile.name, email: key, picture: profile.picture, provider: "google" };
    users.push(user);
    writeUsers(users);
  }
  return saveSession({ ...user, picture: profile.picture || user.picture }, true);
}

/* ---------- Forgot password (OTP بيتبعت من الباك إند عن طريق Brevo) ---------- */

/** step 1: مجرد تجهيز الإيميل. الباك إند هو اللي بيتأكد إن الحساب موجود وهو بيبعت الكود. */
export async function requestPasswordReset({ email }) {
  return { email: normalizeEmail(email) };
}

/** step 2: الباك إند يولّد كود من 4 أرقام ويبعته على الإيميل (الكود مش بيرجع للمتصفح أبدًا). */
export async function sendResetOtp({ email }) {
  await api("/api/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email) }),
    field: "email",
  });
}

const readReset = () => {
  try { return JSON.parse(sessionStorage.getItem(RESET_KEY)); } catch { return null; }
};

/** step 3: الباك إند بيتحقق من الكود، ولو صح بيرجّع resetToken لمرة واحدة. */
export async function verifyResetOtp({ email, code }) {
  const data = await api("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email), code }),
    field: "otp",
  });
  sessionStorage.setItem(RESET_KEY, JSON.stringify({
    email: normalizeEmail(email),
    resetToken: data.resetToken || null,
    expires: Date.now() + RESET_TTL,
    verified: true,
  }));
}

export function isResetVerified(email) {
  const rec = readReset();
  return !!rec && rec.verified && rec.email === normalizeEmail(email) && Date.now() <= rec.expires;
}

/** step 4: بنبعت الباسورد الجديد مع الـ resetToken، والباك إند هو اللي يغيّره. */
export async function resetPassword({ email, password }) {
  if (!isResetVerified(email)) throw new AuthError("password", "Please verify your code first");
  const rec = readReset();
  await api("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email), resetToken: rec.resetToken, password }),
    field: "password",
  });
  sessionStorage.removeItem(RESET_KEY);
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY));
  } catch { return null; }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export const getToken = () => getSession()?.token || null;

export function isOwner(session = getSession()) {
  if (!session) return false;
  if (session.role === "owner") return true;
  const owner = normalizeEmail(import.meta.env.VITE_OWNER_EMAIL || "osamaomran7@gmail.com");
  return !!owner && normalizeEmail(session.email) === owner;
}

/**
 * Only the owner or an active moderator is allowed inside the Admin Dashboard.
 * Anyone else is treated as a regular visitor and redirected to USER_WEB_URL.
 */
export function hasDashboardAccess(session = getSession()) {
  if (!session) return false;
  if (isOwner(session)) return true;
  if (session.active === false) return false;
  const role = String(session.role || "").trim().toLowerCase();
  if (role === "owner" || role === "moderator" || role === "admin") {
    return true;
  }
  return isLocalActiveModerator(session.email);
}

export function canAccessPage(session, pageKey) {
  return checkPageAccess(session, pageKey, isOwner(session));
}

export function getDefaultRoute(session = getSession()) {
  return resolveDefaultRoute(session, isOwner(session));
}
