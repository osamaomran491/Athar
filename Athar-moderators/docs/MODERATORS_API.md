# Moderators API (backend contract)

The Moderators page (`/moderators`) only hides itself in the browser. **The real protection is here, in the backend.**

## Rules
1. Every `/api/moderators` route needs `Authorization: Bearer <token>` **and** the caller must be the owner (`role === "owner"`). Anyone else gets `403`.
2. Hash passwords (bcrypt/argon2). Never return the password or its hash in any response.
3. `POST /api/auth/login` must only succeed for the owner or an **active** moderator. Disabled / removed / unknown accounts get `401`.
   Return the role so the UI knows who is the owner:
   `{ "token": "...", "user": { "name": "...", "email": "...", "role": "owner" | "moderator" } }`
4. Check "active" on **every** protected request (not only at login), so Disable / Remove cuts access immediately.
5. `/api/auth/register` should not create dashboard access by itself.
6. Rate-limit login and `POST /api/moderators`.

## Endpoints
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/moderators` | – | `[ { id, name, email, role, active, createdAt, lastLogin } ]` (or `{ moderators: [...] }`) |
| POST | `/api/moderators` | `{ name, email, password }` | `201` `{ moderator: { id, name, email, active, createdAt } }` |
| PATCH | `/api/moderators/:id` | any of `{ name, email, password, active }` | `200` |
| DELETE | `/api/moderators/:id` | – | `200` / `204` |

Errors: `{ "message": "This email already has access", "field": "email" }` with `409` for a duplicate email
(`field` makes the UI show the message under that input). `401/403` show "no permission" on the page.

## Express sketch
```js
const requireOwner = (req, res, next) =>
  req.user?.role === "owner" ? next() : res.status(403).json({ message: "Forbidden" });

router.use(authenticate, requireOwner);

router.get("/", async (_req, res) => {
  const list = await User.find({ role: "moderator" }).select("-password");
  res.json(list);
});

router.post("/", async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email: email.toLowerCase() }))
    return res.status(409).json({ message: "This email already has access", field: "email" });
  const doc = await User.create({
    name, email: email.toLowerCase(), role: "moderator", active: true,
    password: await bcrypt.hash(password, 12),
  });
  res.status(201).json({ moderator: { id: doc.id, name, email: doc.email, active: true, createdAt: doc.createdAt } });
});
```
Make the owner account yourself (seed / manually in the DB) with `role: "owner"`.
Frontend fallback: set `VITE_OWNER_EMAIL=you@example.com` in `.env` (build-time, shows the page for that email even if `role` is missing).
