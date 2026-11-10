
const USERS_KEY = "Athar_users";
const SESSION_KEY = "Athar_session";
const OTP_KEY = "Athar_reset_otp";
const OTP_TTL = 10 * 60 * 1000; // الكود صالح 10 دقايق

/** خليه false لما الباك إند يبعت الكود على الإيميل فعلاً (بيظهر "Your OTP is ...") */
export const SHOW_DEMO_OTP = true;

export class AuthError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field; 
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

/** profile = { name, email, picture }  */
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

/** Forgot password – step 1: make sure the email belongs to a password account. */
export async function requestPasswordReset({ email }) {
  const user = readUsers().find((u) => u.email === normalize(email));
  if (!user) throw new AuthError("email", "No account found with this email");
  if (!user.passwordHash) {
    throw new AuthError("email", "This account uses Google. Please use “Login with Google”");
  }
  return { email: user.email };
}

/** Forgot password – step 2: generate a 4-digit code for this email.
 *  TODO: لما يبقى فيه باك إند، ابعت الكود على الإيميل من هناك ومترجّعوش للمتصفح. */
export async function sendResetOtp({ email }) {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  sessionStorage.setItem(OTP_KEY, JSON.stringify({
    email: normalize(email), code, expires: Date.now() + OTP_TTL, verified: false,
  }));
  return { code };
}

const readOtp = () => {
  try { return JSON.parse(sessionStorage.getItem(OTP_KEY)); } catch { return null; }
};

/** للعرض التجريبي بس (SHOW_DEMO_OTP) */
export const getDemoOtp = () => readOtp()?.code || "";

/** Forgot password – step 3: check the code the user typed. */
export async function verifyResetOtp({ email, code }) {
  const rec = readOtp();
  if (!rec || rec.email !== normalize(email)) {
    throw new AuthError("otp", "Code expired. Please request a new one");
  }
  if (Date.now() > rec.expires) throw new AuthError("otp", "Code expired. Please request a new one");
  if (rec.code !== code) throw new AuthError("otp", "That code didn’t match. Try again.");
  sessionStorage.setItem(OTP_KEY, JSON.stringify({ ...rec, verified: true }));
}

export function isResetVerified(email) {
  const rec = readOtp();
  return !!rec && rec.verified && rec.email === normalize(email) && Date.now() <= rec.expires;
}

/** Forgot password – step 4: save the new password (only after the code was verified). */
export async function resetPassword({ email, password }) {
  if (!isResetVerified(email)) throw new AuthError("password", "Please verify your code first");
  const users = readUsers();
  const user = users.find((u) => u.email === normalize(email));
  if (!user) throw new AuthError("password", "Account not found. Please start again");
  user.passwordHash = await hash(password);
  writeUsers(users);
  sessionStorage.removeItem(OTP_KEY);
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
