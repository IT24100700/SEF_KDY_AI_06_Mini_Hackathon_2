# HelpSriLanka — AI Agent Ground Rules

> **Read this before touching any code.**
> This is a team hackathon project. Each member owns specific files.
> Violating these rules will break the shared codebase for everyone.

---

## 🔒 GLOBAL FILES — DO NOT MODIFY

These files are owned by the project lead and are considered **finalized infrastructure**.
You must **never edit, refactor, delete, or move** any of the following:

### Frontend (`frontend/`)
| File | Reason |
|------|--------|
| `frontend/vite.config.js` | Tailwind + Vite build config — already configured |
| `frontend/src/index.css` | Global Tailwind import — do not add or remove anything |
| `frontend/src/main.jsx` | React root entry point — do not touch |
| `frontend/src/App.jsx` | Router config with all routes — do not touch |
| `frontend/src/lib/supabaseClient.js` | Shared Supabase client — import it, never rewrite it |
| `frontend/src/components/Navbar.jsx` | Shared navigation — owned by project lead |
| `frontend/package.json` | Dependencies already locked — ask lead before adding packages |
| `frontend/vite.config.js` | Build config — do not modify |
| `frontend/.env.example` | Env template — do not modify |

### Backend (`backend/`)
| File | Reason |
|------|--------|
| `backend/server.js` | Express app entry point with all route mounts — do not touch |
| `backend/package.json` | Dependencies already locked — ask lead before adding packages |
| `backend/.env.example` | Env template — do not modify |

### Root
| File | Reason |
|------|--------|
| `.gitignore` | Already configured — do not modify |
| `AGENTS.md` | This file — obviously do not modify |

---

## ✅ YOUR ZONE — What You Are Allowed to Edit

Each team member works **only inside their assigned page file(s)**.

### Frontend pages (each member owns one or more):
```
frontend/src/pages/Login.jsx
frontend/src/pages/Signup.jsx
frontend/src/pages/RequestForm.jsx
frontend/src/pages/DonateForm.jsx
frontend/src/pages/RequestList.jsx
frontend/src/pages/DonationList.jsx
frontend/src/pages/About.jsx
frontend/src/pages/Feedback.jsx
```

### Backend routes (each member owns one or more):
```
backend/routes/auth.js
backend/routes/items.js
```

You may also create **new files** in these locations if needed:
- `frontend/src/components/` — new UI components (don't touch existing ones)
- `backend/routes/` — new route files (but you must NOT mount them in `server.js` yourself — ask the lead)

---

## 📦 Adding npm Packages

**Do NOT run `npm install <package>` without checking with the project lead first.**
Uncoordinated dependency additions cause `package-lock.json` conflicts.

If you need a package, add a comment in your file:
```js
// DEPENDENCY NEEDED: npm install <package-name>
```
...and inform the lead to install it centrally.

---

## 🔌 Using the Supabase Client

The Supabase client is already initialized. Import it like this — never recreate it:

```js
import { supabase } from '../lib/supabaseClient'
```

---

## 🌿 Git Workflow

- Work on your **own branch**: `git checkout -b feature/<your-name>-<feature>`
- Never push directly to `main`
- Open a Pull Request and tag the lead for review

---

## 🚨 Emergency Contacts (for the app, not Git disputes 😄)
- **117** — Disaster Management Centre
- **119** — Police Emergency
- **110** — Fire & Rescue
- **1990** — Suwaseriya Ambulance
