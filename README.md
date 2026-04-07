<!-- <![CDATA[<div align="center"> -->

<!-- Logo / Banner -->
<br/>

```
 ██████╗ ██████╗ ██████╗ ███████╗██╗██╗███████╗███████╗████████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝██║██║██╔════╝██╔════╝╚══██╔══╝
██║     ██║   ██║██║  ██║█████╗  ██║██║█████╗  ███████╗   ██║
██║     ██║   ██║██║  ██║██╔══╝  ██║██║██╔══╝  ╚════██║   ██║
╚██████╗╚██████╔╝██████╔╝███████╗██║██║███████╗███████║   ██║
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝╚═╝╚══════╝╚══════╝   ╚═╝
         Admin Panel — IIEST Shibpur
```

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Auth.js](https://img.shields.io/badge/Auth.js_v5-purple?style=for-the-badge)](https://authjs.dev)
[![Vercel](https://img.shields.io/badge/Deploy_on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

<p>
  <strong>A standalone admin portal</strong> for <a href="https://codeiiest.in/">CodeIIEST</a> — the competitive programming & development club at IIEST Shibpur.<br/>
  Manage events, verify Codeforces handles, promote admins, audit every action, and power the public leaderboard API.
</p>

</div>

---

## ✨ Features

| Category | Feature |
|---|---|
|  **Auth** | Google OAuth (IIEST email restricted) + Email/OTP registration + Forgot password via reset link |
|  **Profile** | Edit display name, enrollment details, GitHub handle; CF handle verification via Codeforces OAuth |
|  **Events CRUD** | Create / edit / delete events with full metadata (title, description, date, venue, tags, organizers, thumbnail) |
|  **Leaderboard API** | `GET /api/public/leaderboard` — returns all verified CF handles, names, and batch years |
|  **Events API** | `GET /api/public/events` — returns all events as JSON, CORS-enabled, 5-min CDN cache |
|  **RBAC** | Three roles: `user` → `admin` → `superadmin`. Middleware-enforced route protection |
|  **Superadmin** | View all registered users, promote/demote to admin, full audit log of every action |
|  **Audit Logs** | Immutable log of every admin mutation (who changed what, when, old vs new value) |
|  **Settings** | Secure password change flow with current password verification |
|  **Splash Animation** | GDSC-inspired animated CodeIIEST logo on first page load |
|  **Mobile Responsive** | Collapsible sidebar, page title in topbar, responsive layouts throughout |

---

## 🏗️ Architecture

```
codeiiest-admin/
├── src/
│   ├── app/
│   │   ├── (portal)/              # Authenticated portal (middleware-protected)
│   │   │   ├── dashboard/         # User dashboard & stats
│   │   │   ├── profile/           # Edit profile
│   │   │   ├── cf-verify/         # Codeforces OAuth verification
│   │   │   ├── settings/          # Change password
│   │   │   ├── admin/
│   │   │   │   └── events/        # Events CRUD (admin+)
│   │   │   └── superadmin/
│   │   │       ├── users/         # Manage all users (superadmin only)
│   │   │       └── logs/          # Audit logs (superadmin only)
│   │   ├── api/
│   │   │   ├── admin/events/      # CRUD API (auth required)
│   │   │   ├── superadmin/        # User management API
│   │   │   ├── public/
│   │   │   │   ├── leaderboard/   # 🌐 PUBLIC — CF handles + batch years
│   │   │   │   └── events/        # 🌐 PUBLIC — all events
│   │   │   └── auth/              # NextAuth + CF OAuth callbacks
│   │   ├── login/                 # Sign in page
│   │   ├── register/              # OTP registration
│   │   └── forgot-password/       # Password reset flow
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx     # Sidebar with role-based nav
│   │   │   └── Topbar.tsx         # Top bar with page title + user menu
│   │   └── ui/
│   │       ├── codeiiest-logo.tsx # 🔴⬜ Shared SVG logo component
│   │       └── splash-screen.tsx  # Animated intro screen
│   ├── models/                    # Mongoose models: User, Event, AuditLog
│   └── lib/                       # db.ts, auth.ts, utils
├── scripts/
│   ├── seed.mjs                   # Seed events + leaderboard users
│   ├── events.json                # 7 real CodeIIEST events
│   └── data.json                  # ~92 leaderboard registrations
├── .env.example                   # 📄 Environment variable template
└── vercel.json                    # Vercel deployment config
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Google Cloud Console project (for OAuth)
- Upstash account (for Redis OTP rate-limiting)

### 1. Clone & Install

```bash
git clone https://github.com/shivam-smraj/CodeIIEST-Admin-Panel.git
cd CodeIIEST-Admin-Panel
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

See the [Environment Variables](#-environment-variables) section below for detailed instructions.

### 3. Seed the Database

```bash
# Seed events + leaderboard users (idempotent — safe to re-run)
node scripts/seed.mjs

# Re-seed events even if they exist
node scripts/seed.mjs --force
```

> **Seeded passwords**: Each user's password is their enrollment number (uppercased), e.g., `2022ITB004`. Alumni without enrollment numbers get `CODEIIEST2024`.

### 4. Start Development Server

```bash
npm run dev
# → http://localhost:3000
```

---

## 🌐 Public API

These endpoints require **no authentication** and are safe to call from any frontend.

### `GET /api/public/leaderboard`

Returns all users who have a verified Codeforces handle.

```json
[
  {
    "handle": "S_M_Raj",
    "name": "Shivam Kumar",
    "year": 2028
  }
]
```

> `year` = `enrollmentYear + 4` (graduation year — compatible with the GDSC site's `calculateTopCoders.js`)

**Headers:**

- `Access-Control-Allow-Origin: *`
- `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`

---

### `GET /api/public/events`

Returns all events in the database.

```json
[
  {
    "_id": "...",
    "title": "Fresher's Contest 2.0",
    "miniTitle": "Competitive Programming Event",
    "description": "...",
    "imageVariant": "cpdsa",
    "TagsList": ["CP", "DSA", "Programming", "Codeforces"],
    "sideDetails1": { "text1": "Starts", "text2": "10th Feb, 2025", "text3": "5:00 pm" },
    "sideDetails2": { "text1": "venue",  "text2": "CSD205",        "text3": null },
    "AvatarSampleData": [{ "name": "Suraj Kashyap", "img": "surajkashyap.webp" }],
    "completionStatus": 100,
    "moreInfo": "#",
    "createdAt": "2025-03-01T..."
  }
]
```

---

## 🔐 Authentication

Three ways to log in:

| Method | How |
|---|---|
| **Google OAuth** | Click "Continue with Google" — restricted to `@students.iiests.ac.in` domain |
| **Email + Password** | Register with college email → receive OTP → verify → set password |
| **Forgot Password** | Enter email → receive reset link → set new password |

### Role Hierarchy

```
superadmin
    │  All admin privileges
    │  + Promote/demote users to admin
    │  + View all users
    └── admin
            │  All user privileges
            │  + CRUD events
            └── user
                    │
                    └── alumni
```

### Bootstrap Superadmin

On first deployment, set `INITIAL_SUPERADMIN_EMAIL=your@students.iiests.ac.in`. The first Google login from that email is automatically promoted to superadmin. After setup, this env var is safe to remove.

---

## 🌱 Seed Script

```bash
node scripts/seed.mjs           # Seed events (skip if any exist) + seed users
node scripts/seed.mjs --force   # Force re-seed events even if they exist
```

| File | Contents |
|---|---|
| `scripts/events.json` | 7 real CodeIIEST events (Fresher's Contest, WOS, WebGame Challenge, etc.) |
| `scripts/data.json` | ~92 student registrations from the leaderboard sign-up form |

---

## 📋 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `AUTH_SECRET` | ✅ | NextAuth secret (32+ chars). Generate: `openssl rand -base64 32` |
| `AUTH_URL` | ✅ | Your app URL (e.g., `http://localhost:3000` or `https://yourapp.vercel.app`) |
| `AUTH_GOOGLE_ID` | ✅ | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | ✅ | Google OAuth Client Secret |
| `CF_CLIENT_ID` | ✅ | Codeforces API Client ID |
| `CF_CLIENT_SECRET` | ✅ | Codeforces API Client Secret |
| `CF_REDIRECT_URI` | ✅ | `{AUTH_URL}/api/auth/cf/callback` |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis REST URL (for OTP rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis REST token |
| `INITIAL_SUPERADMIN_EMAIL` | ⚠️ | College email of the first superadmin (only used once) |
| `SMTP_EMAIL` | ✅ | Gmail/SMTP sender email address |
| `SMTP_PASSWORD` | ✅ | Gmail App Password or SMTP password |

---

## 🚢 Deploying to Vercel

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "feat: codeiiest admin panel"
git push origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy**

### Step 3 — Add Environment Variables

In your Vercel project → **Settings → Environment Variables**, add all variables from `.env.example`.

> **Important for `AUTH_URL`**: Set it to your production URL, e.g., `https://codeiiest-admin.vercel.app`

> **Important for `CF_REDIRECT_URI`**: Update to `https://codeiiest-admin.vercel.app/api/auth/cf/callback` and add this to your Codeforces API application settings.

### Step 4 — Update Google OAuth

In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth client:

- Add `https://codeiiest-admin.vercel.app/api/auth/callback/google` to **Authorized redirect URIs**
- Optionally restrict to domain `iiests.ac.in` in the OAuth consent screen

---

## 🔗 Integration with GDSC Site

The `codeiiest-gdsc` frontend fetches events and the leaderboard from this panel's public API.

### In `codeiiest-gdsc/client/.env`

```env
# Production: your deployed Vercel URL
VITE_ADMIN_API_URL=https://codeiiest-admin.vercel.app

# Leave empty for local dev (Vite proxy forwards /api/public/* → localhost:3000)
# VITE_ADMIN_API_URL=
```

### How the GDSC leaderboard works

1. Fetches `GET /api/public/leaderboard` from this panel → list of `{handle, name, year}`
2. Fetches live ratings from the Codeforces API for each handle
3. Merges the results and displays the ranked table
4. Results cached in `localStorage` for 5 minutes

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router, Server Components) |
| Language | TypeScript (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Database | [MongoDB](https://mongodb.com) via [Mongoose](https://mongoosejs.com) |
| Auth | [Auth.js v5](https://authjs.dev) (NextAuth) — Google + Credentials providers |
| Email | [Nodemailer](https://nodemailer.com) (OTP + password reset) |
| Rate Limiting | [Upstash Redis](https://upstash.com) |
| Animations | CSS keyframe animations (GDSC-style splash screen) |
| Icons | [Lucide React](https://lucide.dev) |
| Deployment | [Vercel](https://vercel.com) |

---

## 📁 Models

### `User`

```typescript
{
  email:          string   // college email
  displayName:    string
  passwordHash:   string   // bcrypt, null for Google auth users
  role:           "user" | "admin" | "superadmin" | "alumni"
  codeforcesId:   string   // verified CF handle
  enrollmentYear: number   // e.g., 2024 → graduation 2028
  enrollmentNo:   string   // e.g., "2024EEB109"
  githubId:       string
  provider:       "google" | "credentials"
}
```

### `Event`

```typescript
{
  title:            string
  miniTitle:        string
  description:      string
  imageVariant:     string   // e.g., "cpdsa" → /assets/thumbnail/cpdsa.png
  TagsList:         string[]
  sideDetails1:     { text1, text2, text3 }  // label, date, time
  sideDetails2:     { text1, text2, text3 }  // label, value, mode
  AvatarSampleData: { name, img }[]           // event organizers
  completionStatus: number   // 0–100%
  moreInfo:         string   // link or "#"
}
```

### `AuditLog`

```typescript
{
  action:     "CREATE_EVENT" | "UPDATE_EVENT" | "DELETE_EVENT" | "UPDATE_USER_ROLE"
  performedBy: ObjectId      // admin who did it
  targetId:   ObjectId       // affected resource
  diff:       object         // { before, after }
  createdAt:  Date
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Make changes and ensure TypeScript passes: `npx tsc --noEmit`
4. Commit: `git commit -m "feat: your feature"`
5. Push and open a Pull Request

---

<div align="center">
  <sub>Built with ❤️ by the CodeIIEST development team at IIEST Shibpur</sub>
</div>
<!-- ]]> -->
