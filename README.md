# ⚡ VoltMart

VoltMart is a full-stack electronics e-commerce demo featuring a live customer storefront, a real-time admin dashboard ("Seller Central"), a price-elasticity simulator, and an AI-powered shopping assistant — all backed by a single in-memory Express API.

Changes made in the admin dashboard (stock, orders, coupons, banners, settings) reflect instantly on the storefront, making it a great sandbox for demoing e-commerce operations end-to-end.

---

## 🌐 Live Demo

**Try the live application here:**  
https://voltmart.ai.studio/

## ✨ Features

- **Customer Storefront** — browse 300+ seeded products across 16 categories, flash sales, trending/featured sections, cart, wishlist, coupons, and checkout.
- **Seller Central (Admin Dashboard)** — manage products, orders, customers, coupons, hero banners, and store settings; monitor live activity logs and analytics.
- **AI Shop Assistant ("VoltBot")** — a chatbot grounded in the live product catalog, current stock, active coupons, and recent orders, so answers always reflect real-time store state.
- **Support Hub** — simulated two-way customer communications (callback requests, SMS inquiries) and a mock SMS/OTP dispatch gateway.
- **Trustpilot-style Reviews** — customers can leave reviews; admins can reply.
- **Price-Elasticity Simulator** — experiment with pricing and discounts and see the effect on demand.
- **Real-time Activity Feed** — every view, cart add, wishlist add, and checkout is logged and streamed to the admin dashboard.

---

## 🏗️ Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion (`motion`), Lucide Icons |
| Backend    | Express (Node.js), TypeScript, in-memory data store |
| AI Backend | Google Gemini, wrapped behind a server-side `/api/chatbot` endpoint |
| Tooling    | esbuild, tsx |

The AI assistant is never called directly from the browser. All requests go through the Express server (`server.ts`), which holds the API key, assembles the live store context (catalog, stock, coupons, recent orders), and returns a plain JSON response to the frontend. This keeps your AI provider credentials off the client entirely.

---

## 📁 Project Structure

```
VoltMart-main/
├── server.ts                 # Express API + AI backend integration + in-memory DB
├── src/
│   ├── App.tsx                # App shell / routing between storefront & admin
│   ├── main.tsx                # React entry point
│   ├── index.css               # Tailwind styles
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── components/
│   │   ├── CustomerStorefront.tsx   # Customer-facing shop UI
│   │   ├── SellerCentral.tsx        # Admin dashboard UI
│   │   ├── ChatbotWidget.tsx        # VoltBot chat UI
│   │   └── Confetti.tsx             # Checkout success animation
│   └── utils/
│       └── audio.ts             # Sound effect helpers
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# .env.local
GEMINI_API_KEY="your-ai-backend-api-key"
APP_URL="http://localhost:3000"
```

`GEMINI_API_KEY` powers the server-side AI assistant backend. If it's omitted, VoltBot will still run and reply with a friendly notice instead of erroring out — everything else in the app works normally without it.

### 3. Run the app locally

```bash
npm run dev
```

This starts the Express server with Vite in middleware mode, serving both the API and the frontend from a single origin at **http://localhost:3000**.

### 4. Build for production

```bash
npm run build
npm start
```

`npm run build` compiles the frontend with Vite and bundles the server with esbuild into `dist/server.cjs`. `npm start` runs the production bundle.

---

## 🔌 API Overview

All routes are served from the same Express app under `/api`.

| Resource        | Endpoints |
|------------------|-----------|
| Products         | `GET/POST /api/products`, `PUT/DELETE /api/products/:id` |
| Orders           | `GET/POST /api/orders`, `PUT /api/orders/:id` |
| Activity Logs    | `GET/POST /api/activity` |
| Customers        | `GET /api/customers` |
| Coupons          | `GET/POST /api/coupons`, `PUT /api/coupons/:code` |
| Hero Banners     | `GET/POST/DELETE /api/banners` |
| Store Settings   | `GET/POST /api/settings` |
| Reviews          | `GET/POST /api/reviews`, `POST /api/reviews/:id/reply` |
| Communications   | `GET/POST /api/communications`, `PUT /api/communications/:id`, `POST /api/communications/send-otp` |
| AI Assistant     | `POST /api/chatbot` |

> **Note:** Data is stored in memory and seeded on server start. Restarting the server resets the store to its initial demo state — there is no persistent database in this version.

---
