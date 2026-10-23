/* ==================================================================
   AUTH SERVICE  (نسخة تجريبية بتخزن في المتصفح)
   -----------------------------------------------------------------
   دلوقتي الحسابات بتتحفظ في localStorage عشان تقدر تجرّب:
     - تسجّل حساب في /register
     - تدخل بنفس الإيميل والباسورد في /login
     - لو الباسورد غلط → "Incorrect password"
   لما يبقى عندك Backend: بدّل جسم كل function هنا بـ fetch/axios
   وباقي الصفحات مش هتتغير.
================================================================== */
const USERS_KEY = "ather_users";
const SESSION_KEY = "ather_session";

export class AuthError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field; // اسم الحقل اللي فيه المشكلة (email / password)
  }
}

/* ---------- helpers ---------- */
const readUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
};
const writeUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const normalize = (email) => email.trim().toLowerCase();

async function hash(text) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return btoa(unescape(encodeURIComponent(text))); // fallback للمتصفحات غير الآمنة
}

function saveSession(user, remember = true) {
  const session = { name: user.name, email: user.email, picture: user.picture || null, provider: user.provider };
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/* ---------- public API ---------- */
export async function registerUser({ name, email, password }) {
  const users = readUsers();
  const key = normalize(email);
  if (users.some((u) => u.email === key)) {
    throw new AuthError("email", "An account with this email already exists");
  }
  users.push({ name: name.trim(), email: key, passwordHash: await hash(password), provider: "password" });
  writeUsers(users);
}

export async function loginUser({ email, password, remember }) {
  const user = readUsers().find((u) => u.email === normalize(email));
  if (!user) throw new AuthError("email", "No account found with this email");
  if (!user.passwordHash) {
    throw new AuthError("password", "This account uses Google. Please use “Login with Google”");
  }
  if (user.passwordHash !== (await hash(password))) {
    throw new AuthError("password", "Incorrect password. Please try again");
  }
  return saveSession(user, remember);
}

/** profile = { name, email, picture } جاية من Google */
export async function loginWithGoogle(profile) {
  const users = readUsers();
  const key = normalize(profile.email);
  let user = users.find((u) => u.email === key);
  if (!user) {
    user = { name: profile.name, email: key, picture: profile.picture, provider: "google" };
    users.push(user);
    writeUsers(users);
  }
  return saveSession({ ...user, picture: profile.picture || user.picture }, true);
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
