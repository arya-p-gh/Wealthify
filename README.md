# Wealthify

Smart wealth and investment portfolio management for Indian markets: track holdings, follow the market, set goals and plan with calculators. The UI is a green-on-black market terminal: monospace type, live ticker tape, status bar and keyboard navigation (⌥1–6, ⌘K).

**This is a demo project with no accounts.** Click "Try the demo" to open a sample portfolio, or start empty and add your own. Holdings, watchlist, goals and profile are saved in the visitor's own browser (localStorage), so every visitor gets a private copy and nothing personal is stored on a server. Market data is live.

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
| Backend  | Node.js + Express: a stateless market-data API (no database, no accounts) |
| Storage  | Browser localStorage (`wealthify:demo:v1`), handled in `frontend/src/lib/store.js` |
| Data     | Yahoo Finance chart API (cached 60s; falls back to the NSE listing when BSE data is sparse) |

## Getting started

```bash
# 1. Market data API (http://localhost:5001)
cd backend
npm install
npm run dev

# 2. Web app (http://localhost:3000)
cd ../frontend
npm install
npm run dev
```

To deploy, host the API anywhere that runs Node (`npm start`, optionally set `CLIENT_ORIGIN` for CORS) and the frontend as a static site (`npm run build`, output in `frontend/dist`) with `VITE_API_URL` pointing at the API. No database is needed.

## API overview

All routes are public and read-only; the browser only sends symbols and quantities to price them.

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
