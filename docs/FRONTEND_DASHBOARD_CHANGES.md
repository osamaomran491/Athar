# دليل تعديلات الداشبورد (Frontend — Athar Dashboard)

> [!NOTE]
> كل التعديلات اللي تحت دي **اتطبقت فعلاً واتحفظت** في مشروعك على المسار:  
> `D:\BHI\Final Project\VS Code\Athar`  
> الفايل ده مرجع كامل ليك فيه كل ملف اتضاف أو اتعدل وبالكود بتاعه عشان تبقى شايف كل سطر اتغير في مشروع الداشبورد.

---

## ملخص سريع للملفات

| الحالة | الملف | الغرض |
|---|---|---|
| جديد | `src/utils/permissions.js` | الصلاحيات المركزية + لينك ويب اليوزر + حساب الصفحة الافتراضية |
| معدل | `.env` و `.env.example` | إضافة `VITE_USER_WEB_URL` |
| معدل | `src/services/authService.js` | التحقق من صلاحية دخول الداشبورد `hasDashboardAccess` و`canAccessPage` |
| معدل | `src/services/moderatorService.js` | تصليح `addModerator` وإرسال `permissions` وحفظ/حذف الحالة محلياً |
| معدل | `src/pages/Moderators.jsx` | checkboxes الصفحات + التحقق من اختيار صفحة واحدة على الأقل |
| معدل | `src/components/dashboard/Sidebar.jsx` | فلترة روابط السايدبار حسب صلاحيات الحساب |
| معدل | `src/pages/Login.jsx` | تحويل غير المصرح لهم لصفحة الهوم بتاعة ويب اليوزر |
| معدل | `src/components/ui/GoogleButton.jsx` | نفس التحويل مع تسجيل الدخول بجوجل |
| معدل | `src/App.jsx` | حماية كل صفحات الداشبورد بـ `RequireAccess` |
| جديد | `docs/BACKEND_MODERATORS_GUIDE.md` | الملف اللي هتبعته لصاحب الباك إند |

---

## 1. `.env` و `.env.example`

```env
VITE_API_URL=

VITE_OWNER_EMAIL=osamaomran7@gmail.com
VITE_USER_WEB_URL=https://clarafahem-cell.github.io/athar-museums/?page=museums
```

---

## 2. `src/utils/permissions.js` (ملف جديد)

مسؤول عن:
- قائمة صفحات الداشبورد (`DASHBOARD_PAGES`)
- لينك صفحة الهوم بتاعة اليوزر (`USER_WEB_URL`)
- تخزين وقراءة الصلاحيات محلياً (`Athar_perms` / `Athar_moderators_demo`) لحين ربط الباك إند
- دوال `canAccessPage` و`getDefaultRoute`

```js
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
```

---

## 3. `src/services/authService.js`

أضاف:
- حفظ `active` و`permissions` في السيشن عند اللوجين
- دالة `hasDashboardAccess(session)`: ترجّع `true` فقط لو الحساب Owner أو Moderator نشط
- دوال `canAccessPage` و`getDefaultRoute` و`USER_WEB_URL`

```js
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
```

---

## 4. `src/services/moderatorService.js`

اللي اتصلح واتعدل فيه:
- مسح السطور الغلط اللي كانت بره أي فانكشن
- تعديل `addModerator({ name, email, password, permissions })` عشان يبعت `permissions` للباك إند ويحفظها محلياً
- تعديل `updateModerator` و`removeModerator` عشان لما تعمل **Edit / Disable / Enable / Remove** تتحدث الصلاحيات وحالة التفعيل أو تتحذف

---

## 5. `src/pages/Moderators.jsx`

اللي اتعدل فيه:
- استخدام `DASHBOARD_PAGES` من `src/utils/permissions.js`
- قراءة الصلاحيات المحفوظة وقت فتح **Edit** عن طريق `getDemoPermissions(member?.email)`
- إضافة تحقق يمنع الحفظ لو مفيش ولا صفحة متعلمة: `"Select at least one page"`
- تمرير `email: member.email` مع `updateModerator` و`removeModerator`

---

## 6. `src/components/dashboard/Sidebar.jsx`

فلترة عناصر القائمة عن طريق `canAccessPage`:

```jsx
{navItems
  .filter((item) => {
    const session = getSession();
    return canAccessPage(session, item.ownerOnly ? "moderators" : item.key);
  })
  .map(({ label, icon: Icon, to }) => (
```

---

## 7. `src/pages/Login.jsx`

بعد نجاح `loginUser(data)`:
- لو `!hasDashboardAccess(session)` ← بيعمل `logout()` ويحوّله على `USER_WEB_URL`
- لو مصرحله ← بيوديه على `getDefaultRoute(session) || "/dashboard"`

```jsx
  const onValid = async (data) => {
    const session = await loginUser(data); // لو الباسورد غلط بترمي AuthError("password", ...)
    if (!hasDashboardAccess(session)) {
      logout();
      await showLoader({ onCovered: () => window.location.replace(USER_WEB_URL) });
      return;
    }
    const target = getDefaultRoute(session) || "/dashboard";
    await showLoader({ onCovered: () => navigate(target) }); // شاشة اللوجو ثم الصفحة
  };
```

---

## 8. `src/components/ui/GoogleButton.jsx`

نفس منطق التحويل على Google Login:

```jsx
  const startGoogle = useGoogleAuth({
    onSuccess: (session) => {
      if (!hasDashboardAccess(session)) {
        logout();
        showLoader({ onCovered: () => window.location.replace(USER_WEB_URL) });
        return;
      }
      showLoader({ onCovered: () => navigate(getDefaultRoute(session) || "/dashboard") });
    },
    onError: (err) => onError(err.message),
  });
```

---

## 9. `src/App.jsx`

حماية كل مسارات الداشبورد بـ `RequireAccess` (عشان مفيش مستخدم أو موديريتور يفتح صفحة مش مسموحة له حتى لو كتب اللينك مباشرةً):

```jsx
function RedirectToUserWeb() {
  useEffect(() => {
    logout();
    window.location.replace(USER_WEB_URL);
  }, []);
  return null;
}

function RequireAccess({ pageKey, children }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (!hasDashboardAccess(session)) return <RedirectToUserWeb />;
  if (pageKey && !canAccessPage(session, pageKey)) {
    const fallback = getDefaultRoute(session);
    return fallback ? <Navigate to={fallback} replace /> : <RedirectToUserWeb />;
  }
  return children;
}
```

وكل route بقى متغلف بـ `<RequireAccess pageKey="...">`، ومسار `/moderators` بقى فوق `<Route path="*" ... />`.
