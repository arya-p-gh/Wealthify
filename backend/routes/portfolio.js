const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Portfolio = require('../models/Portfolio');

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

// Get all portfolio holdings for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const holdings = await Portfolio.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ holdings });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add a new holding to portfolio
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { symbol, companyName, quantity, averagePrice, currentPrice, exchange } = req.body;

        // Validate required fields
        if (!symbol || !companyName || !quantity || !averagePrice) {
            return res.status(400).json({
                message: 'Missing required fields: symbol, companyName, quantity, averagePrice'
            });
        }

        // Check if holding already exists
        const existingHolding = await Portfolio.findOne({
            userId: req.userId,
            symbol: symbol.toUpperCase()
        });

        if (existingHolding) {
            return res.status(400).json({
                message: 'Holding already exists. Use PUT to update.'
            });
        }

        const holding = new Portfolio({
            userId: req.userId,
            symbol: symbol.toUpperCase(),
            companyName,
            exchange: exchange || 'NSE',
            quantity,
            averagePrice,
            currentPrice: currentPrice || averagePrice,
            lastUpdated: new Date()
        });

        await holding.save();
        res.status(201).json({
            message: 'Holding added successfully',
            holding
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a holding
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { quantity, averagePrice, currentPrice } = req.body;

        const holding = await Portfolio.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!holding) {
            return res.status(404).json({ message: 'Holding not found' });
        }

        if (quantity !== undefined) holding.quantity = quantity;
        if (averagePrice !== undefined) holding.averagePrice = averagePrice;
        if (currentPrice !== undefined) holding.currentPrice = currentPrice;
        holding.lastUpdated = new Date();

        await holding.save();
        res.json({
            message: 'Holding updated successfully',
            holding
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a holding
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const holding = await Portfolio.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!holding) {
            return res.status(404).json({ message: 'Holding not found' });
        }

        res.json({ message: 'Holding deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
