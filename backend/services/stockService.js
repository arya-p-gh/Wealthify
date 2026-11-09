// Market data service.
// Uses Yahoo Finance's public chart endpoint (no crumb/cookie needed), which is far
// less prone to 429s than the quote endpoint. Results are cached in memory.

const axios = require('axios');
const INDIAN_STOCKS = require('../data/stocks');

const QUOTE_TTL = 60 * 1000; // 1 min
const HISTORY_TTL = 10 * 60 * 1000; // 10 min
const quoteCache = new Map();
const historyCache = new Map();
const inflight = new Map();

const INDICES = [
    { symbol: '^NSEI', name: 'NIFTY 50' },
    { symbol: '^BSESN', name: 'SENSEX' },
    { symbol: '^NSEBANK', name: 'NIFTY BANK' },
    { symbol: '^CNXIT', name: 'NIFTY IT' },
];

const RANGES = {
    '1D': { range: '1d', interval: '5m' },
    '1W': { range: '5d', interval: '30m' },
    '1M': { range: '1mo', interval: '1d' },
    '6M': { range: '6mo', interval: '1d' },
    '1Y': { range: '1y', interval: '1d' },
    '5Y': { range: '5y', interval: '1wk' },
};

const http = axios.create({
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Wealthify)' },
});

const findStock = (symbol) => INDIAN_STOCKS.find((s) => s.symbol === String(symbol).toUpperCase());

async function fetchChart(symbol, range, interval) {
    const key = `${symbol}|${range}|${interval}`;
    if (inflight.has(key)) return inflight.get(key);
    const p = (async () => {
        let lastErr;
        for (const host of ['query1', 'query2']) {
            try {
                const { data } = await http.get(
                    `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
                    { params: { range, interval, includePrePost: false } }
                );
                const result = data?.chart?.result?.[0];
                if (!result) throw new Error(data?.chart?.error?.description || 'No data');
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

// Yahoo's BSE (.BO) daily series is sometimes truncated to a single candle while the
// NSE (.NS) listing of the same company is complete — fall back to it when that happens.
// Tickers retired after corporate actions → their current listing, so older
// portfolio / watchlist entries keep getting real prices.
const LEGACY_SYMBOLS = { 'TATAMOTORS.BO': 'TMPV.BO', 'TATAMOTORS.NS': 'TMPV.NS' };

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

function searchStocks(query) {
    if (!query || query.length < 1) return [];
    const q = query.toUpperCase();
    return INDIAN_STOCKS.filter(
        (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q) || s.sector.toUpperCase().includes(q)
    ).slice(0, 10);
}

async function getStockPrice(symbol) {
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

const getStockQuote = getStockPrice;

async function getHistory(symbol, rangeKey = '1M') {
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

// Limits concurrency so a big batch doesn't hammer Yahoo.
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

async function updateMultiplePrices(symbols) {
    const results = await mapLimit(symbols, 8, (s) => getStockPrice(s));
    return results.map((r, idx) => ({
        symbol: symbols[idx],
        success: r.status === 'fulfilled',
        data: r.status === 'fulfilled' ? r.value : null,
        error: r.status === 'rejected' ? r.reason.message : null,
    }));
}

async function getIndices() {
    const results = await updateMultiplePrices(INDICES.map((i) => i.symbol));
    return results
        .filter((r) => r.success)
        .map((r) => ({ ...r.data, name: INDICES.find((i) => i.symbol === r.symbol).name }));
}

module.exports = {
    searchStocks,
    getStockPrice,
    getStockQuote,
    getHistory,
    getIndices,
    updateMultiplePrices,
    findStock,
    RANGES,
    INDIAN_STOCKS,
};
