# MarketPulse AI

MarketPulse AI is an India-focused stock market dashboard. It tracks NSE-listed large-cap stocks, Indian indices (NIFTY 50, Bank Nifty, Sensex), Indian sector indices, and a few global indices for comparison, alongside an AI-powered market intelligence feature.

- **Frontend:** React + Vite (deployed on Vercel)
- **Backend:** Express (deployed on Render)
- **Database:** MongoDB (for storage/caching of data as needed)
- **AI:** Google Gemini (market intelligence / chat features)

---

## ⚠️ Known Issue: Deployment Currently Offline

The live deployment has been taken offline. Here's why, in plain terms:

The backend fetches stock/index data using **`yahoo-finance2`**, an **unofficial** npm package that scrapes Yahoo Finance's internal (non-public) endpoints. It works by first requesting a session cookie and a "crumb" token from Yahoo, then using that crumb to request quote data.

This works fine when run **locally** — a home/residential IP address has no history of automated traffic, so Yahoo doesn't flag it.

It **fails after deployment** because:

1. **Cloud IPs get flagged.** Render (like Vercel, AWS, and most cloud hosts) uses shared datacenter IP ranges. Yahoo aggressively rate-limits or blocks these ranges, since most large-scale scraping traffic originates from datacenters, not homes.
2. **No official rate limit exists to respect.** Because this isn't a real public API, there's no published quota to stay under — Yahoo can throttle or block at any time, without warning, and there's no way to appeal or predict when a block will lift.
3. **Request volume made it worse.** The original code fetched quotes for ~50 tracked stocks individually (one HTTP request per stock) rather than batching them, which produced bursts of requests that look like abuse to Yahoo's rate limiter — even from genuine, low-traffic usage.

Once an IP is flagged, **even the initial crumb/session request** gets a `429 Too Many Requests` response — meaning the backend can't authenticate with Yahoo at all, not just fetch quotes. That's the exact failure seen on the Render deployment.

**Fix in progress:** Migrating the data layer from `yahoo-finance2` to [Twelve Data](https://twelvedata.com), a documented, official API with a real (if smaller) free-tier quota that also covers NSE/BSE-listed stocks — unlike some other alternatives (e.g. Finnhub), whose free tier is US-exchanges only. This removes the dependency on scraping a private, unofficial endpoint, and adds caching + stale-data fallback so a quota hiccup doesn't take the whole dashboard down.

**Until this migration is complete, expect the live deployment to be unavailable or unreliable.** Running the project locally works as described below, since local requests aren't hitting Yahoo's flagged cloud-IP ranges.

---

## Running MarketPulse AI Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (v20+ recommended)
- npm (comes with Node.js)
- A [MongoDB](https://www.mongodb.com/) connection string (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works)
- A [Google Gemini API key](https://ai.google.dev/) for the AI market intelligence feature

### 1. Get the code

Extract or clone the project so you have two folders: `client/` (frontend) and `server/` (backend).

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in `server/` with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_MODEL=your_preferred_gemini_model
GEMINI_MODEL_FALLBACKS=comma_separated_fallback_models
GEMINI_API_KEY=your_gemini_api_key
ALLOWED_ORIGINS=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

By default it runs at `http://localhost:5000`, with routes available at:
- `http://localhost:5000/api/market`
- `http://localhost:5000/api/ai`
- `http://localhost:5000/api/health` (health check)

### 3. Set up the frontend

In a separate terminal:

```bash
cd client
npm install
```

Create a `.env` file in `client/` with:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

By default it runs at `http://localhost:5173` and will talk to your locally running backend.

### 4. Open the app

Visit `http://localhost:5173` in your browser. The frontend will call your local backend, which will fetch live market data directly from Yahoo Finance (or Twelve Data, once the migration lands) using your own machine's IP — which is why it works locally even while the deployed version doesn't.

---

## Project Structure

```
client/
└── src/
    ├── components/     # UI components (movers, charts, news, events, etc.)
    ├── hooks/          # Data-fetching hooks
    ├── services/       # API client (marketApi.js)
    └── theme/          # Chart theming

server/
└── src/
    ├── controllers/    # Route handlers
    ├── services/       # Market data, AI, caching, and related logic
    ├── routes/         # Express route definitions
    ├── config/         # Database connection
    └── utils/          # Shared utilities
```

## Notes

- Never commit `.env` files or API keys to version control.
- The `VITE_` prefix exposes a variable to the browser bundle — only put public, non-sensitive values (like the API base URL) behind it. Secrets like `GEMINI_API_KEY` and the future `TWELVEDATA_API_KEY` belong only in the **backend's** `.env` / hosting provider's environment variables, never the frontend's.