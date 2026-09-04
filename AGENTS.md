# HelpSriLanka — AI Agent Ground Rules & Project Specification

> **Read this before touching any code.**
> This is a team hackathon project. Each member owns specific files.
> Violating these rules will break the shared codebase for everyone.

---

## 🎯 What We Are Building: "HelpSriLanka"

**HelpSriLanka** is a real-time flood and disaster emergency dispatch web platform designed for Sri Lanka during crises. It bridges the gap between affected citizens, emergency responders, volunteers, and donors.

### Core Features & Workflow
1. **Aid Request Flow (`/request-aid` -> `/requests`)**:
   - Victims or local coordinators fill out an emergency request (location/district, contact details, type of aid needed like food/water/medical/rescue, number of affected people, urgency level).
   - Requests are stored in Supabase (`items` table with `type = 'request'`) and displayed in real time on the Aid Requests Board (`/requests`).
2. **Donation & Volunteer Flow (`/donate` -> `/donations`)**:
   - Donors and volunteers submit offers (supplies, financial assistance, equipment, rescue volunteer hours).
   - Pledges are stored in Supabase (`items` table with `type = 'donation'`) and listed on the Donations Board (`/donations`) for matching with requests.
3. **Authentication Flow (`/login`, `/signup`)**:
   - User authentication powered by Supabase Auth (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`).
4. **Emergency Hotlines & Awareness (`/about`, `Navbar`)**:
   - One-click access to National Disaster Management (117), Police (119), Ambulance (1990), and Fire/Rescue (110).
5. **Feedback Loop (`/feedback`)**:
   - Allows citizens and relief teams to submit incident updates and platform feedback.

---

## 🛠️ Technology Stack & Languages

- **Frontend**:
  - **Language**: JavaScript (ES modules, JSX)
  - **Framework**: React 19 + Vite
  - **Routing**: React Router DOM v7 (`BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`)
  - **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, utility classes)
  - **Backend Client**: `@supabase/supabase-js` (via `src/lib/supabaseClient.js`)
- **Backend**:
  - **Language**: JavaScript (Node.js, CommonJS)
  - **Server Framework**: Express 5
  - **Database & Auth**: Supabase (PostgreSQL + Supabase Auth)
  - **Utilities**: `cors`, `dotenv`

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
| `AGENTS.md` | This file — do not modify |

---

## ✅ YOUR ZONE — What You Are Allowed to Edit

Each team member works **only inside their assigned page file(s) or backend route(s)**.

### Frontend pages (assign one or more per teammate):
- `frontend/src/pages/Login.jsx` — Supabase Login UI & logic
- `frontend/src/pages/Signup.jsx` — Supabase Registration UI & logic
- `frontend/src/pages/RequestForm.jsx` — Aid request submission form
- `frontend/src/pages/DonateForm.jsx` — Donation & volunteer offer submission form
- `frontend/src/pages/RequestList.jsx` — Live aid requests directory & status tracking
- `frontend/src/pages/DonationList.jsx` — Live donations directory
- `frontend/src/pages/About.jsx` — Disaster guidelines, hotlines & team info
- `frontend/src/pages/Feedback.jsx` — Feedback & incident report form

### Backend routes (assign per teammate):
- `backend/routes/auth.js` — Auth endpoints (`POST /api/auth/signup`, `POST /api/auth/login`)
- `backend/routes/items.js` — Aid/Donation endpoints (`GET /api/items`, `POST /api/items`)

### Additional components / helper files:
- If you need new reusable UI components, create **new files** in `frontend/src/components/YourComponent.jsx` (do NOT edit existing shared components like `Navbar.jsx`).
- If you need new backend routes, create **new files** in `backend/routes/yourRoute.js` and ask the project lead to mount them in `server.js`.

---

## 🔌 Using the Supabase Client (Frontend)

The Supabase client is already initialized. Always import the shared instance:

```js
import { supabase } from '../lib/supabaseClient'
```

Example usage:
```js
// Fetch aid requests
const { data, error } = await supabase
  .from('items')
  .select('*')
  .eq('type', 'request')
  .order('created_at', { ascending: false })

// Insert an aid request
const { data, error } = await supabase
  .from('items')
  .insert([{ type: 'request', name, contact, location, description }])
```

---

## 🎨 UI & Styling Guidelines
- Use **Tailwind CSS classes** for styling (e.g., `bg-red-600`, `rounded-xl`, `shadow-sm`, `p-6`, `grid grid-cols-1 md:grid-cols-2 gap-4`).
- Ensure all forms and views are **mobile-responsive** (essential for disaster field workers on mobile phones).
- Maintain high contrast and accessible layout.

---

## 📦 Adding npm Packages

**Do NOT run `npm install <package>` without checking with the project lead first.**
Uncoordinated dependency additions cause `package-lock.json` merge conflicts.

If you need a package, add a comment in your file:
```js
// DEPENDENCY NEEDED: npm install <package-name>
```
...and inform the lead to install it centrally.

---

## 🌿 Git Workflow

1. Create and switch to your feature branch:
   ```bash
   git checkout -b feature/<your-name>-<feature-name>
   ```
2. Commit your changes only inside your assigned files.
3. Push your branch and open a Pull Request for review:
   ```bash
   git push origin feature/<your-name>-<feature-name>
   ```

---

## 🚨 Emergency Contacts (Sri Lanka)
- **117** — Disaster Management Centre (DMC)
- **119** — Police Emergency
- **110** — Fire & Rescue
- **1990** — Suwaseriya Ambulance Service
