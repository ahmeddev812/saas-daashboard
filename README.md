# ATLARIS — SaaS Analytics Dashboard

> "Carry your business. See everything."

ATLARIS is a complete, **frontend-only** SaaS analytics dashboard. It records customers,
products, orders, revenue targets and team activity, and derives every metric shown in the
UI from that state. There is **no backend, no database and no real payments** — all data
lives in your browser's `localStorage`.

---

## Stack

| Layer      | Choice                                        |
| ---------- | --------------------------------------------- |
| Framework  | Next.js **16** (App Router, Turbopack)        |
| UI         | React **19**, TypeScript **strict**           |
| Styling    | Tailwind CSS **v4** (CSS-first config)        |
| Motion     | framer-motion **13** (respects reduced motion)|
| Charts     | recharts **3** (`ResponsiveContainer`)        |
| Icons      | lucide-react                                  |
| Theme      | next-themes (light/dark, persisted)           |

## Getting started

```bash
npm install     # install dependencies
npm run dev     # development server on http://localhost:3000
npm run build   # production build (Turbopack + type checking)
npm run start   # serve the production build
npm run lint    # eslint (zero warnings is the target)
```

## Routes

| Route              | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `/`                | Marketing landing page                               |
| `/login` `/signup` | Local demo auth (browser only)                       |
| `/onboarding`      | Workspace setup wizard                               |
| `/dashboard`       | KPI cards, MRR chart, revenue target, activity feed  |
| `/customers` `/customers/[id]` | List, CRUD, import/export and detail view |
| `/products`        | Catalogue CRUD with archive/restore                  |
| `/orders` `/orders/[id]` | Order workflow (pending → paid → fulfilled, refunds) |
| `/revenue`         | Recognized revenue, targets, forecasts               |
| `/analytics`       | Breakdowns by customer, product, status and channel  |
| `/reports`         | Report templates + CSV / JSON export, print          |
| `/team`            | Members, roles, invitations, activity log            |
| `/settings`        | Profile, appearance, backup/restore, danger zone     |
| `/search`          | Full-page search (also `⌘K` / `Ctrl+K` everywhere)   |

Unknown URLs render a branded `404` (`src/app/not-found.tsx`); render errors surface a
branded recovery screen (`src/app/error.tsx`).

## Demo data (opt-in only)

Nothing is seeded silently. Sample data is created **only** when you ask for it:

- Sign in with the demo account on `/login` ("Explore the demo workspace"), **or**
- Press **Load demo data** on an empty dashboard.

Demo credentials: `demo@atlaris.app` / `Demo!2026`

The seed (`src/lib/seed.ts`) generates a deterministic ~90-day dataset: 16 customers,
10 products, 64 orders (including refunds), team members and an activity feed — enough
variation for the charts to be meaningful. A normal signup always starts clean, and the
seed is never applied to a workspace that already contains records.

## Architecture

```
src/
  app/          Routes, layouts, error.tsx, not-found.tsx, loading.tsx
  components/   Feature components (dashboard, customers, orders, …) + ui/ kit
  context/      BusinessDataProvider (single source of truth), AuthContext, ToastContext
  hooks/        useBusinessData, useBusinessActions, useMounted/useWindowEvent
  lib/          storage, calculations, dates, export, auth, seed, defaults, id
  types/        Business domain model
  data/         Static landing-page content
```

Rules the code follows:

- **Single source of truth** — every screen reads `useBusiness()`; no local copies of metrics.
- **Derived metrics** — `src/lib/calculations.ts` computes MRR, revenue, growth, funnels etc.
  No number shown in the UI is hard-coded.
- **All `localStorage` I/O** goes through `src/lib/storage.ts`, never during SSR, and every
  read is wrapped in `try/catch` so corrupt data degrades to defaults instead of crashing.
- **Reusable UI** — modals, tables, badges, toasts, skeletons and empty states come from
  `src/components/ui`.

## Data, privacy and limits

- Storage keys are namespaced `atlaris_*` (business, customers, products, orders, team,
  activities, goals, settings, users).
- **Reset Data** clears only `atlaris_*` keys — never other sites' storage.
- **Export / Import** (Settings → Data & backup) writes/reads a JSON backup; imports are
  pre-flight validated before anything is replaced.
- Auth is a demo convenience only: no server session, no secure password storage. Never
  use it to protect real data.

## Verification

Every phase of the build was verified with:

```bash
npm run lint    # eslint — 0 errors, 0 warnings
npm run build   # strict TypeScript + production build — 17 routes
npm run start   # HTTP smoke: all routes 200, unknown routes 404
```

## Deploy on Vercel

The project is a standard Next.js App Router app with no server-only APIs, so deployment
is zero-config:

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Or push the repository to GitHub and import it in the Vercel dashboard — framework
preset **Next.js**, no environment variables required. All data stays in the visitor's
browser; deploying does not change the privacy model.

## Specification

Built to the ATLARIS specification (15 development phases, accessibility, responsive
behaviour at 375/768/1024/1440, error/empty/loading states, demo seed, export/import,
Definition of Done).
