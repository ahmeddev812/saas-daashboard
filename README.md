# ATLARIS

> **Carry your business. See everything.**

A premium, local-first SaaS analytics dashboard that turns customers, products and orders into readable business signal — MRR, ARR, churn, LTV, revenue and goal insights — entirely in the browser.

🔗 **Live demo:** https://saas-daashboard.vercel.app/

---

## ✨ What is ATLARIS?

ATLARIS is a **working analytics dashboard**, not a static mockup. You record customers, products and orders; ATLARIS derives every metric, chart and report from those same records. Change a price, refund an order or close a goal once — and every screen follows.

- **Local-first** — all data lives in your browser's `localStorage`. Nothing is sent to a server.
- **Derived, never hard-coded** — MRR, ARR, churn, LTV, ARPU and growth are calculated from real state.
- **Honest analytics** — when data is insufficient, ATLARIS shows an empty/manual state instead of inventing a number.
- **Opt-in demo** — load ~90 days of sample data with one click, or start with a clean workspace.

> ⚠️ **Security boundary:** Authentication is local/demo only. Credentials and data are stored on your device and are **not** production-grade. Do not reuse a real password.

---

## 🚀 Features

### Landing
- Hero with tagline and animated dashboard preview
- Bento feature grid, 3-step "How it works"
- Testimonials, Free/Pro pricing (presentation only), FAQ, CTA

### Auth & Onboarding
- Local signup / login / logout
- Password strength meter
- Remember me (unchecked by default)
- One-click **Demo User** with 90-day seed data
- 4-step onboarding: name & business → industry, currency, fiscal year → primary goal → theme & targets

### Dashboard
- Time-based greeting and business context
- Live metric cards: **MRR, Active Customers, Orders, Revenue**
- MRR growth chart (Recharts)
- Revenue vs target progress
- Recent orders, top customers, activity feed
- Quick actions and meaningful empty states

### Customers
- Full CRUD with search, status/plan filters, tags
- Bulk actions
- Customer detail: profile, order history, MRR history, notes
- CSV import / export
- Delete confirmation and no-results states

### Products
- Full CRUD: name, description, price, category, stock, status (`active | draft | archived`)
- Historical order lines **retain captured prices** — history never rewrites itself

### Orders
- Full CRUD with customer selection
- Multi-product line items (quantity + captured price)
- Automatic line totals and order total
- Workflow: `pending → paid → fulfilled`
- `refunded` as a **terminal** state — excluded from recognized revenue
- Filters (date, status, customer), receipt/invoice view

### Revenue Analytics
- MRR, ARR, churn rate, LTV, ARPU
- CAC via manual acquisition-cost input
- Revenue by product / customer / period
- Simple cohort analysis
- Zero-denominator and insufficient-data handling

### Analytics & Reports
- Date-range picker, revenue trends, customer growth, product performance
- Conversion funnel: signup → trial → paid
- Pre-built report templates
- CSV and JSON export with date-stamped filenames
- Print-friendly report view

### Team, Settings & Search
- Team list with `owner | admin | member` roles (UI/demo only) and activity log
- Business profile, currency, timezone, fiscal year, theme
- JSON export/import with validation and explicit replacement confirmation
- Danger zone: safe reset of `atlaris_*` keys
- Global `⌘K` / `Ctrl+K` command palette across customers, products and orders

---

## 🧱 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Framework, routing, layouts |
| **React 19** | UI and client state |
| **TypeScript 5** (strict) | Type safety |
| **Tailwind CSS v4** | Styling (`@theme` in `globals.css`) |
| **framer-motion** | Animations |
| **next-themes** | Light / dark / system theme |
| **Recharts** | Charts |
| **lucide-react** | Icons |
| **localStorage** | Local persistence |
| **Vercel** | Deployment |

> No backend, no database, no real payments. This is a frontend/local-first product by design.

---

## 📁 Project Structure
