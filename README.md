# Wealthify

Smart wealth and investment portfolio management for Indian markets: track holdings, follow the market, set goals and plan with calculators. The UI is a green-on-black market terminal: monospace type, live ticker tape, status bar and keyboard navigation (⌥1–6, ⌘K).

**This is a demo project with no accounts.** Click "Try the demo" to open a sample portfolio, or start empty and add your own. Holdings, watchlist, goals and profile are saved in the visitor's own browser (localStorage), so every visitor gets a private copy and nothing personal is stored on a server. Market data is live.

It's a single Vite app: the live market data comes from a small `/api` that runs as a Vercel serverless function in production and inside the Vite dev server locally. There is no database, no separate backend and no environment variables to set.

## Features

- **Live landing page**: real NIFTY 50 intraday chart, all four indices, market breadth and top movers, with no sign-in needed.
- **Dashboard**: animated portfolio value, a 1D–1Y value chart, today's and overall P&L, sector allocation, top movers and market breadth.
- **Wealth Score (300–900)**: a portfolio health score built from diversification, concentration, returns and goal progress, with a breakdown of each factor.
- **Smart insights**: flags sector and single-stock concentration, deep losers, big winners and diversification gaps.
- **Portfolio**: search, sector and profit/loss filters, sortable columns, pagination and CSV export. Buying more of a stock you already hold averages into the existing position.
- **Markets**: live NIFTY 50, SENSEX, NIFTY BANK and NIFTY IT; a sector heatmap; 90+ large caps with sparklines and one-tap watchlisting.
- **Stock detail**: charts from 1D to 5Y, key stats, a 52-week range bar, your position, and a "What if I had invested ₹X" calculator.
- **Watchlist with price alerts**: set above/below levels; triggered alerts show on the dashboard.
- **Goals**: name a goal, pick a date and see the monthly SIP needed to reach it. Log savings as you go.
- **Calculators**: SIP, step-up SIP, lumpsum and loan EMI, each with a year-by-year breakdown and an inflation-adjusted value.
- **⌘K / Ctrl+K search**, a **hide balances** privacy toggle, a mobile bottom nav, and Settings to export holdings, reset to sample data, start empty or delete everything.

## Tech stack

| Layer    | Stack |
|----------|-------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 3, Framer Motion, Recharts, Lucide icons |
| API      | `frontend/server/` — a stateless market-data handler, deployed as a Vercel function (`api/market.js`) |
| Storage  | Browser localStorage (`wealthify:demo:v1`), handled in `frontend/src/lib/store.js` |
| Data     | Yahoo Finance chart API (cached 60s; falls back to the NSE listing when BSE data is sparse) |

## Getting started

```bash
cd frontend
npm install
npm run dev        # app + market-data API on http://localhost:3000
```

### Deploy to Vercel

Import the GitHub repo into Vercel and deploy. Nothing else to configure:

- `vercel.json` (at the repo root, and in `frontend/`) sets the install/build commands, the output folder, the `/api` function and the single-page-app fallback, so it works whether the project's Root Directory is the repo root or `frontend`.
- No environment variables are needed. API responses are cached on Vercel's CDN for 60 seconds.

## API overview

All routes are public; the browser only sends symbols and quantities to price them.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/stocks/market` | Quotes for all tracked stocks, top gainers/losers, market breadth |
| GET | `/api/stocks/indices` | NIFTY 50, SENSEX, NIFTY BANK, NIFTY IT |
| GET | `/api/stocks/quote/:symbol`, `/price/:symbol` | One live quote |
| GET | `/api/stocks/history/:symbol?range=1D\|1W\|1M\|6M\|1Y\|5Y` | Price history |
| GET | `/api/stocks/search?q=`, `/list` | Search / list the stock universe |
| POST | `/api/stocks/prices` | Live quotes for up to 100 symbols |
| POST | `/api/stocks/portfolio-history` | Portfolio value over time for the holdings sent |

Market data may be delayed. Nothing here is investment advice.
