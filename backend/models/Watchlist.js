const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true
    },
    companyName: {
        type: String,
        required: true
    },
    exchange: {
        type: String,
        enum: ['NSE', 'BSE'],
        default: 'NSE'
    },
    currentPrice: {
        type: Number,
        default: 0
    },
    priceChange: {
        type: Number,
        default: 0
    },
    priceChangePercent: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for userId and symbol to prevent duplicates
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
