<div align="center">

# 📊 ATLARIS

### Carry your business. See everything.

**A premium SaaS analytics dashboard for small businesses — track MRR, customers, orders, and products in one place. Local-first, no server, no data leaves your browser.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-saas--daashboard.vercel.app-6C5CE7?style=for-the-badge&logo=vercel&logoColor=white)](https://saas-daashboard.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](./LICENSE)

[Live Demo](https://saas-daashboard.vercel.app/) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Roadmap](#-roadmap)

</div>

---

## 📖 About

**ATLARIS** is a modern, local-first **SaaS analytics dashboard** that helps small businesses track everything that matters — revenue, customers, products, orders, and team activity — all in one clean, professional interface.

Built on a **single source of truth** principle: every screen reads from the same records. Change a price, refund an order, or close a goal once — and the whole dashboard follows.

> 🎯 **Live:** [saas-daashboard.vercel.app](https://saas-daashboard.vercel.app/)

**100% browser-based.** Your data never leaves your device — everything lives in `localStorage` under `atlaris_*` keys.

---

## ✨ Features

### 📈 Live Metrics
- **MRR, ARR, churn, LTV, ARPU, growth** — recalculated the instant you change a record
- Never a stale number
- Dashboard updates in real time as you edit

### 👥 Customer Records
- Search, tag, filter, and bulk-edit your entire book of business
- Every change written directly to browser storage
- Advanced filtering (status, tags, revenue range)

### 🛍️ Product Catalogue
- Prices you set today are **captured on the order line tomorrow**
- Price history never rewrites itself when you change a price
- Full CRUD with version-aware pricing

### 📦 Order Workflow
- **Pending → Paid → Fulfilled** state machine
- Refunds as a clean **terminal state** (excluded from recognized revenue)
- Line items with captured prices for accurate history

### 👨‍👩‍👧 Team & Activity
- Invite teammates, assign roles (Owner / Admin / Member)
- Running **activity log** of everything that happened in the workspace
- Real-time feed of actions

### 📊 Reports & Export
- Pre-built report templates over your current filters
- Export to **CSV or JSON** with date-stamped filenames
- Full data backup via JSON export/import with validation

### 🎨 Premium UI
- **Dual theme** — light + dark with system preference support
- Glass morphism, gradients, and micro-interactions
- Fully responsive (mobile → desktop)
- Accessible (ARIA labels, keyboard nav, focus rings)

### ⚡ Local-First Architecture
- 100% client-side — no server, no database
- Data stored in `localStorage` with `atlaris_` prefix
- Works offline
- JSON backup & restore

---

## 🛠️ Tech Stack

| Category | Tech |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (strict mode) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Storage** | `localStorage` (SSR-guarded) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** / **pnpm** / **yarn** / **bun**

### Installation

```bash
# Clone the repository
git clone https://github.com/ahmeddev812/saas-dashboard.git
cd saas-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
