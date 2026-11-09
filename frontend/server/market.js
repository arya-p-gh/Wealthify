// Live Indian market data from Yahoo Finance's public chart endpoint.
// Runs server-side (Vercel function in production, Vite middleware in development)
// because Yahoo doesn't allow browsers to call it directly (CORS).
// Results are cached in memory per instance; responses are also CDN-cached.

import { INDIAN_STOCKS } from './stocks.js';

export { INDIAN_STOCKS };

const QUOTE_TTL = 60 * 1000;
const HISTORY_TTL = 10 * 60 * 1000;
const quoteCache = new Map();
const historyCache = new Map();
const inflight = new Map();

export const INDICES = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX' },
  { symbol: '^NSEBANK', name: 'NIFTY BANK' },
  { symbol: '^CNXIT', name: 'NIFTY IT' },
];

export const RANGES = {
  '1D': { range: '1d', interval: '5m' },
  '1W': { range: '5d', interval: '30m' },
  '1M': { range: '1mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
};

// Tickers retired after corporate actions → their current listing
const LEGACY_SYMBOLS = { 'TATAMOTORS.BO': 'TMPV.BO', 'TATAMOTORS.NS': 'TMPV.NS' };

export const findStock = (symbol) => INDIAN_STOCKS.find((s) => s.symbol === String(symbol).toUpperCase());

async function fetchChart(symbol, range, interval) {
  const key = `${symbol}|${range}|${interval}`;
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    let lastErr;
    for (const host of ['query1', 'query2']) {
      try {
        const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Wealthify)' },
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json().catch(() => null);
        const result = data?.chart?.result?.[0];
        if (!result) throw new Error(data?.chart?.error?.description || `Yahoo responded ${res.status}`);
        return result;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Yahoo's BSE (.BO) series is sometimes truncated to a single candle while the NSE (.NS)
// listing of the same company is complete — fall back to it when that happens.
async function fetchChartSmart(symbol, range, interval) {
  symbol = LEGACY_SYMBOLS[symbol] || symbol;
  const result = await fetchChart(symbol, range, interval);
  const n = (result.timestamp || []).length;
  if (n >= 2 || !/\.BO$/.test(symbol)) return result;
  try {
    const alt = await fetchChart(symbol.replace(/\.BO$/, '.NS'), range, interval);
    if ((alt.timestamp || []).length > n) return alt;
  } catch {
    /* keep the BSE result */
  }
  return result;
}

export function searchStocks(query) {
  if (!query) return [];
  const q = query.toUpperCase();
  return INDIAN_STOCKS.filter((s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q) || s.sector.toUpperCase().includes(q)).slice(0, 10);
}

export async function getStockPrice(symbol) {
  const key = String(symbol).toUpperCase();
  const cached = quoteCache.get(key);
  if (cached && Date.now() - cached.ts < QUOTE_TTL) return cached.data;

  const result = await fetchChartSmart(key, '1d', '5m');
  const m = result.meta || {};
  const q = result.indicators?.quote?.[0] || {};
  const closes = (q.close || []).filter((v) => v != null);
  const price = m.regularMarketPrice ?? closes[closes.length - 1] ?? 0;
  const prev = m.chartPreviousClose ?? m.previousClose ?? price;
  const change = price - prev;
  const info = findStock(key);

  const data = {
    symbol: key,
    name: info?.name || m.longName || m.shortName || key,
    sector: info?.sector || 'Other',
    exchange: info?.exchange || m.exchangeName || 'BSE',
    price,
    change,
    changePercent: prev ? (change / prev) * 100 : 0,
    open: (q.open || []).find((v) => v != null) ?? prev,
    high: m.regularMarketDayHigh ?? price,
    low: m.regularMarketDayLow ?? price,
    volume: m.regularMarketVolume ?? 0,
    previousClose: prev,
    fiftyTwoWeekHigh: m.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: m.fiftyTwoWeekLow ?? null,
    spark: closes.filter((_, i) => i % 3 === 0),
    lastUpdated: new Date((m.regularMarketTime || Date.now() / 1000) * 1000).toISOString(),
  };
  quoteCache.set(key, { ts: Date.now(), data });
  return data;
}

export async function getHistory(symbol, rangeKey = '1M') {
  const cfg = RANGES[rangeKey] || RANGES['1M'];
  const sym = String(symbol).toUpperCase();
  const key = `${sym}|${rangeKey}`;
  const cached = historyCache.get(key);
  const ttl = rangeKey === '1D' ? QUOTE_TTL : HISTORY_TTL;
  if (cached && Date.now() - cached.ts < ttl) return cached.data;

  const result = await fetchChartSmart(sym, cfg.range, cfg.interval);
  const ts = result.timestamp || [];
  const q = result.indicators?.quote?.[0] || {};
  const points = ts
    .map((t, i) => ({ t: t * 1000, o: q.open?.[i], h: q.high?.[i], l: q.low?.[i], c: q.close?.[i], v: q.volume?.[i] }))
    .filter((p) => p.c != null);
  const data = { symbol: sym, range: rangeKey, previousClose: result.meta?.chartPreviousClose ?? null, points };
  historyCache.set(key, { ts: Date.now(), data });
  return data;
}

// Limits concurrency so a big batch doesn't hammer Yahoo
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        out[idx] = { status: 'fulfilled', value: await fn(items[idx]) };
      } catch (e) {
        out[idx] = { status: 'rejected', reason: e };
      }
    }
  });
  await Promise.all(workers);
  return out;
}

export async function getPrices(symbols) {
  const results = await mapLimit(symbols, 10, (s) => getStockPrice(s));
  return results.map((r, idx) => ({
    symbol: symbols[idx],
    success: r.status === 'fulfilled',
    data: r.status === 'fulfilled' ? r.value : null,
    error: r.status === 'rejected' ? r.reason.message : null,
  }));
}

export async function getIndices() {
  const results = await getPrices(INDICES.map((i) => i.symbol));
  return results.filter((r) => r.success).map((r) => ({ ...r.data, name: INDICES.find((i) => i.symbol === r.symbol).name }));
}

export async function getMarket() {
  const results = await getPrices(INDIAN_STOCKS.map((s) => s.symbol));
  const stocks = results.filter((r) => r.success).map((r) => r.data);
  const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  return {
    stocks,
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
    breadth: {
      advances: stocks.filter((s) => s.change > 0).length,
      declines: stocks.filter((s) => s.change < 0).length,
      unchanged: stocks.filter((s) => s.change === 0).length,
    },
  };
}

// Portfolio value over time for holdings sent by the browser ({ symbol, quantity, currentPrice })
export async function getPortfolioHistory(holdingsIn, range = '1M') {
  const holdings = (Array.isArray(holdingsIn) ? holdingsIn : [])
    .filter((h) => h && typeof h.symbol === 'string' && Number(h.quantity) > 0)
    .slice(0, 100);
  if (!holdings.length) return { points: [] };

  const histories = await Promise.allSettled(holdings.map((h) => getHistory(h.symbol, range)));
  const intraday = range === '1D' || range === '1W';
  const bucketOf = (t) => (intraday ? Math.floor(t / 300000) * 300000 : new Date(t).setUTCHours(0, 0, 0, 0));

  // Per-holding series keyed by bucket; forward-filled because Yahoo is sometimes sparse
  const series = holdings.map((h, i) => {
    const r = histories[i];
    const m = new Map();
    if (r.status === 'fulfilled') r.value.points.forEach((p) => m.set(bucketOf(p.t), p.c));
    return { qty: Number(h.quantity), fallback: Number(h.currentPrice || h.averagePrice) || 0, map: m };
  });
  const good = series.filter((s) => s.map.size >= 2);
  const timeline = [...new Set(good.flatMap((s) => [...s.map.keys()]))].sort((a, b) => a - b);
  const last = series.map((s) => {
    const firstKey = [...s.map.keys()].sort((a, b) => a - b)[0];
    return firstKey != null ? s.map.get(firstKey) : s.fallback;
  });
  const points = timeline.map((t) => {
    let v = 0;
    series.forEach((s, i) => {
      if (s.map.has(t)) last[i] = s.map.get(t);
      v += last[i] * s.qty;
    });
    return { t, v: Math.round(v * 100) / 100 };
  });
  return { points };
}
