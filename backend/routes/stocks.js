// market data routes

const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');

const fail = (res, msg, error) => res.status(502).json({ message: msg, error: error.message });

router.get('/search', (req, res) => {
    res.json({ stocks: stockService.searchStocks(req.query.q || '') });
});

router.get('/list', (req, res) => {
    res.json({ stocks: stockService.INDIAN_STOCKS });
});

router.get('/indices', async (req, res) => {
    try {
        res.json({ indices: await stockService.getIndices() });
    } catch (error) {
        fail(res, 'Failed to fetch indices', error);
    }
});

// Live quotes for the full catalogue (cached for 60s server-side)
router.get('/market', async (req, res) => {
    try {
        const list = stockService.INDIAN_STOCKS;
        const results = await stockService.updateMultiplePrices(list.map((s) => s.symbol));
        const stocks = results.filter((r) => r.success).map((r) => r.data);
        const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
        res.json({
            stocks,
            gainers: sorted.slice(0, 5),
            losers: sorted.slice(-5).reverse(),
            breadth: {
                advances: stocks.filter((s) => s.change > 0).length,
                declines: stocks.filter((s) => s.change < 0).length,
                unchanged: stocks.filter((s) => s.change === 0).length,
            },
        });
    } catch (error) {
        fail(res, 'Failed to fetch market data', error);
    }
});

router.get('/price/:symbol', async (req, res) => {
    try {
        res.json(await stockService.getStockPrice(req.params.symbol));
    } catch (error) {
        fail(res, 'Failed to fetch price', error);
    }
});

router.get('/quote/:symbol', async (req, res) => {
    try {
        res.json(await stockService.getStockQuote(req.params.symbol));
    } catch (error) {
        fail(res, 'Failed to fetch quote', error);
    }
});

router.get('/history/:symbol', async (req, res) => {
    try {
        res.json(await stockService.getHistory(req.params.symbol, req.query.range));
    } catch (error) {
        fail(res, 'Failed to fetch history', error);
    }
});

router.post('/prices', async (req, res) => {
    const { symbols } = req.body;
    if (!Array.isArray(symbols)) return res.status(400).json({ message: 'symbols array is required' });
    res.json({ results: await stockService.updateMultiplePrices(symbols.slice(0, 100)) });
});

// Portfolio value over time. Stateless: the browser sends its holdings
// ({ symbol, quantity, currentPrice }) and gets back a value series.
router.post('/portfolio-history', async (req, res) => {
    try {
        const range = req.body.range || '1M';
        const holdings = (Array.isArray(req.body.holdings) ? req.body.holdings : [])
            .filter((h) => h && typeof h.symbol === 'string' && Number(h.quantity) > 0)
            .slice(0, 100);
        if (!holdings.length) return res.json({ points: [] });

        const histories = await Promise.allSettled(holdings.map((h) => stockService.getHistory(h.symbol, range)));
        const intraday = range === '1D' || range === '1W';
        const bucketOf = (t) => (intraday ? Math.floor(t / 300000) * 300000 : new Date(t).setUTCHours(0, 0, 0, 0));

        // Per-holding series keyed by bucket; forward-filled because Yahoo is sometimes sparse.
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
        res.json({ points });
    } catch (error) {
        fail(res, 'Failed to build portfolio history', error);
    }
});

module.exports = router;
