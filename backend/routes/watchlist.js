const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Watchlist = require('../models/Watchlist');

// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.userId;
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// Get all watchlist items for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await Watchlist.find({ userId: req.userId })
            .sort({ addedAt: -1 })
            .lean();
        res.json({ items });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add a stock to watchlist
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { symbol, companyName, currentPrice, priceChange, priceChangePercent, exchange } = req.body;

        // Validate required fields
        if (!symbol || !companyName) {
            return res.status(400).json({
                message: 'Missing required fields: symbol, companyName'
            });
        }

        // Check if item already exists
        const existingItem = await Watchlist.findOne({
            userId: req.userId,
            symbol: symbol.toUpperCase()
        });

        if (existingItem) {
            return res.status(400).json({
                message: 'Stock already in watchlist'
            });
        }

        const item = new Watchlist({
            userId: req.userId,
            symbol: symbol.toUpperCase(),
            companyName,
            exchange: exchange || 'NSE',
            currentPrice: currentPrice || 0,
            priceChange: priceChange || 0,
            priceChangePercent: priceChangePercent || 0,
            lastUpdated: new Date()
        });

        await item.save();
        res.status(201).json({
            message: 'Stock added to watchlist',
            item
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update watchlist item (mainly for price updates)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { currentPrice, priceChange, priceChangePercent } = req.body;

        const item = await Watchlist.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!item) {
            return res.status(404).json({ message: 'Watchlist item not found' });
        }

        if (currentPrice !== undefined) item.currentPrice = currentPrice;
        if (priceChange !== undefined) item.priceChange = priceChange;
        if (priceChangePercent !== undefined) item.priceChangePercent = priceChangePercent;
        item.lastUpdated = new Date();

        await item.save();
        res.json({
            message: 'Watchlist item updated successfully',
            item
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a watchlist item
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const item = await Watchlist.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!item) {
            return res.status(404).json({ message: 'Watchlist item not found' });
        }

        res.json({ message: 'Stock removed from watchlist' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
