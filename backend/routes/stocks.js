// stocks CRUDs

const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');

router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ stocks: [] });
        }

        const results = stockService.searchStocks(q);
        res.json({ stocks: results });
    } catch (error) {
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
});

router.get('/price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const priceData = await stockService.getStockPrice(symbol);
        res.json(priceData);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch price', error: error.message });
    }
});

router.get('/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const quote = await stockService.getStockQuote(symbol);
        res.json(quote);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch quote', error: error.message });
    }
});

router.get('/list', (req, res) => {
    try {
        res.json({ stocks: stockService.INDIAN_STOCKS });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stock list', error: error.message });
    }
});

router.post('/prices', async (req, res) => {
    try {
        const { symbols } = req.body;

        if (!symbols || !Array.isArray(symbols)) {
            return res.status(400).json({ message: 'symbols array is required' });
        }

        const results = await stockService.updateMultiplePrices(symbols);
        res.json({ results });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update prices', error: error.message });
    }
});

module.exports = router;
