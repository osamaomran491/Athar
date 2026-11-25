# دليل الباك إند — ربط نظام الـ Owner و الـ Moderators و الصلاحيات (Athar Dashboard)

الملف ده بيشرح كل التعديلات المطلوبة في **الـ Database** و **الـ API** عشان نظام صلاحيات الـ **Moderators** يشتغل بالكامل على كل الأجهزة والمتصفحات، وكمان عشان اليوزر العادي يتحوّل لويب اليوزر تلقائياً.

---

## 1. ملخص اللي اتعمل في الفرونت إند (Frontend)

الفرونت إند اتعدّل بحيث:
1. أي حساب يدخل من صفحة اللوجين (أو Google Login):
   - لو `role === "owner"` (أو إيميله = `VITE_OWNER_EMAIL`) ← يدخل الداشبورد ويشوف **كل الصفحات + صفحة `/moderators`**.
   - لو `role === "moderator"` و `active === true` ← يدخل الداشبورد ويشوف **فقط** الصفحات الموجودة في `user.permissions`.
   - لو أي حساب تاني (مثلاً `role === "user"`) أو حساب موديريتور معمول له `active: false` ← **يتقفل دخوله للداشبورد ويتحوّل تلقائياً على ويب اليوزر**:
     `https://clarafahem-cell.github.io/athar-museums/?page=museums`
2. صفحة `/moderators` (Owner فقط) بقت بتسمح بـ:
   - إضافة Moderator (`POST /api/moderators`) بالاسم + الإيميل + الباسورد + `permissions`.
   - تعديل بياناته أو صلاحياته أو إيقافه/تفعيله (`PATCH /api/moderators/:id`).
   - مسح الموديريتور (`DELETE /api/moderators/:id`).

> حالياً عشان الباك إند لسه مش بيخزن `permissions`، الفرونت بيستخدم `localStorage` كحل مؤقت في نفس المتصفح بس. أول ما الباك إند يطبق التعديلات اللي تحت، هيشتغل أوتوماتيك على كل المتصفحات والأجهزة.

---

## 2. التعديلات المطلوبة في الـ Database (User Model / Table)

زوّد (أو تأكد من وجود) الحقول دي في جدول/Collection الـ `Users`:

| الحقل | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|
| `role` | `String` (`"owner" \| "moderator" \| "user"`) | `"user"` | نوع الحساب. أي حساب جديد من Register لازم يبقى `"user"` |
| `active` | `Boolean` | `true` | لو `false` يتمنع الموديريتور من اللوجين ومن أي request |
| `permissions` | `Array<String>` | `[]` | أسماء الصفحات المسموح للموديريتور يشوفها (مش مطلوب للـ owner) |
| `createdAt` | `Date` | `Date.now` | تاريخ إضافة العضو |
| `lastLogin` | `Date` | `null` | آخر وقت تسجيل دخول (اختياري للعرض في الجدول) |

### القيم المعتمدة جوا `permissions`:
لازم تتخزن بنفس الحروف الصغيرة دي بالظبط (Lowercase):

```json
["dashboard", "museums", "artifacts", "robots", "bookings", "setting"]
```

| Key | الصفحة في الداشبورد |
|---|---|
| `"dashboard"` | `/dashboard` |
| `"museums"` | `/museums` |
| `"artifacts"` | `/artifacts` |
| `"robots"` | `/robots` و `/robots/:id` |
| `"bookings"` | `/bookings` |
| `"setting"` | `/setting` |

> **مهم:** اعمل حساب الـ Owner في الداتابيز بنفسك (Seed أو تعديل يدوي) وخلي `role: "owner"` و `active: true`.

---

## 3. التعديلات المطلوبة في Auth APIs

### أ) `POST /api/auth/register`
- لازم دايماً يحفظ الحساب الجديد بـ `role: "user"` (تجاهل أي `role` أو `permissions` ممكن تتبعت في الـ body).
- ماينفعش أي حد يسجل من Register ياخد صلاحية داشبورد.

### ب) `POST /api/auth/login`
1. لو الحساب `active === false` ← رجّع `403` أو `401` برسالة زي:
   ```json
   { "message": "This account has been disabled" }
   ```
2. حدّث `lastLogin = new Date()`.
3. رجّع الـ `role` و `active` و `permissions` جوا `user` في الـ Response:
   ```json
   {
     "token": "JWT_TOKEN_HERE",
     "user": {
       "id": "66f1...",
       "name": "Osama Omran",
       "email": "moderator@example.com",
       "role": "moderator",
       "active": true,
       "permissions": ["dashboard", "robots", "bookings"]
     }
   }
   ```
   - لو `role === "owner"` ← تقدر ترجّع `permissions: ["dashboard", "museums", "artifacts", "robots", "bookings", "setting"]` أو `null`.
   - لو `role === "user"` ← يرجّع `role: "user"` و `permissions: []` (والفرونت هيحوّله علطول لويب اليوزر).

### ج) Auth Middleware (على كل الـ Routes المحمية)
- في كل request محمي بالتوكن، اقرأ المستخدم من الداتابيز واتأكد إن:
  - الحساب لسه موجود (ماتمسحش بـ `DELETE`).
  - `user.active === true`.
- لو اتمسح أو بقى `active: false` ← رجّع `401` فوراً (عشان لما الـ Owner يعمل Disable أو Remove يتقطع عليه الأكسس في ساعتها).

---

## 4. الـ Endpoints الجديدة المطلوبة (`/api/moderators`)

> **حماية إجبارية:** كل الـ 4 endpoints دول لازم يعدّوا على `authenticate` + `requireOwner` (لو `req.user.role !== "owner"` يرجّع `403 Forbidden`).  
> **أمان الباسورد:** اعمل Hash للباسورد (`bcrypt` / `argon2`)، وما ترجّعش الـ `password` ولا الـ hash في أي Response أبداً.

### 1) جلب كل الموديريتورز — `GET /api/moderators`
- **Response (`200`):** Array مباشر أو `{ moderators: [...] }`:
  ```json
  [
    {
      "id": "66f1...",
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "role": "moderator",
      "active": true,
      "permissions": ["dashboard", "bookings"],
      "createdAt": "2026-11-25T10:00:00.000Z",
      "lastLogin": "2026-11-25T15:30:00.000Z"
    }
  ]
  ```

### 2) إضافة موديريتور جديد — `POST /api/moderators`
- **Request Body:**
  ```json
  {
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "password": "StrongPassword1!",
    "permissions": ["dashboard", "bookings"]
  }
  ```
- **ملاحظات:**
  - اعمل `email.trim().toLowerCase()`.
  - اتأكد إن الإيميل مش موجود قبل كده (لو موجود رجّع **`409`**):
    ```json
    { "message": "This email already has access", "field": "email" }
    ```
  - اعمل Validation لـ `permissions` إن كل عنصر من ضمن القائمة المعتمدة، ولو مش مبعوتة خلي الافتراضي مثلاً `["dashboard"]` أو كل الصفحات.
- **Response (`201`):**
  ```json
  {
    "moderator": {
      "id": "66f1...",
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "role": "moderator",
      "active": true,
      "permissions": ["dashboard", "bookings"],
      "createdAt": "2026-11-25T10:00:00.000Z"
    }
  }
  ```

### 3) تعديل موديريتور / صلاحياته / تفعيله أو إيقافه — `PATCH /api/moderators/:id`
- **Request Body** (أي مجموعة من الحقول دي — كله اختياري):
  ```json
  {
    "name": "Ahmed Mohamed",
    "email": "ahmed.new@example.com",
    "password": "NewPassword1!",
    "active": false,
    "permissions": ["dashboard", "robots", "bookings"]
  }
  ```
- **ملاحظات مهمة:**
  - لو `password` مش مبعوت في الـ body أو فاضي ← **سيب الباسورد القديم زي ما هو** (متعملش overwrite).
  - لو `email` اتغيّر لإيميل مستخدم تاني ← رجّع **`409`** مع `{ "message": "This email already has access", "field": "email" }`.
  - عدّل فقط المستخدم اللي الـ `role` بتاعه `"moderator"` (متسمحش بتعديل حساب `owner` من هنا).
- **Response (`200`):** `{ "moderator": { ... } }` (أو `{ "ok": true }`).

### 4) حذف موديريتور — `DELETE /api/moderators/:id`
- يمسح الموديريتور (أو يرجّع `role` بتاعه لـ `"user"` ويصفّر `permissions` حسب تصميم الداتابيز عندك — يفضّل المسح لو الحساب اتعمل مخصوص كـ moderator).
- تأكد إن ماينفعش يمسح حساب `owner`.
- **Response (`200` أو `204`)**.

---

## 5. مثال كود جاهز (Express + Mongoose)

```js
import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
const ALLOWED_PERMS = ["dashboard", "museums", "artifacts", "robots", "bookings", "setting"];

const sanitizePerms = (perms) =>
  Array.isArray(perms) ? [...new Set(perms.filter((p) => ALLOWED_PERMS.includes(p)))] : [];

const requireOwner = (req, res, next) =>
  req.user?.role === "owner"
    ? next()
    : res.status(403).json({ message: "Forbidden: owner only" });

router.use(authenticate, requireOwner);

// GET /api/moderators
router.get("/", async (_req, res) => {
  const list = await User.find({ role: "moderator" })
    .select("-password")
    .sort({ createdAt: -1 });
  res.json(list);
});

// POST /api/moderators
router.post("/", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const permissions = sanitizePerms(req.body.permissions);

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  if (await User.exists({ email })) {
    return res.status(409).json({ message: "This email already has access", field: "email" });
  }

  const doc = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: "moderator",
    active: true,
    permissions: permissions.length ? permissions : ALLOWED_PERMS,
  });

  res.status(201).json({
    moderator: {
      id: doc._id,
      name: doc.name,
      email: doc.email,
      role: doc.role,
      active: doc.active,
      permissions: doc.permissions,
      createdAt: doc.createdAt,
    },
  });
});

// PATCH /api/moderators/:id
router.patch("/:id", async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
  if (req.body.active !== undefined) updates.active = Boolean(req.body.active);
  if (req.body.permissions !== undefined) updates.permissions = sanitizePerms(req.body.permissions);

  if (req.body.email !== undefined) {
    const email = String(req.body.email).trim().toLowerCase();
    const dup = await User.exists({ email, _id: { $ne: req.params.id } });
    if (dup) return res.status(409).json({ message: "This email already has access", field: "email" });
    updates.email = email;
  }

  if (req.body.password) {
    updates.password = await bcrypt.hash(String(req.body.password), 12);
  }

  const doc = await User.findOneAndUpdate(
    { _id: req.params.id, role: "moderator" },
    { $set: updates },
    { new: true }
  ).select("-password");

  if (!doc) return res.status(404).json({ message: "Moderator not found" });
  res.json({ moderator: doc });
});

// DELETE /api/moderators/:id
router.delete("/:id", async (req, res) => {
  const doc = await User.findOneAndDelete({ _id: req.params.id, role: "moderator" });
  if (!doc) return res.status(404).json({ message: "Moderator not found" });
  res.json({ ok: true });
});

export default router;
```

---

## 6. ملخص سريع للـ APIs المطلوبة من الباك إند

| Method | Path | مين مسموحله | المطلوب |
|---|---|---|---|
| `POST` | `/api/auth/register` | الكل | ينشئ `role: "user"` دايماً |
| `POST` | `/api/auth/login` | الكل (لو `active: true`) | يرجّع `user: { id, name, email, role, active, permissions }` + `token` |
| `GET` | `/api/moderators` | Owner فقط | يرجّع لستة الـ moderators بدون باسورد |
| `POST` | `/api/moderators` | Owner فقط | يضيف moderator جديد بالـ `permissions` |
| `PATCH` | `/api/moderators/:id` | Owner فقط | يعدّل الاسم / الإيميل / الباسورد / `active` / `permissions` |
| `DELETE` | `/api/moderators/:id` | Owner فقط | يمسح الـ moderator |
