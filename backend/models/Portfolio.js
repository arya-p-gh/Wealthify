// portfolio schema for mongodb

const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
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
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    averagePrice: {
        type: Number,
        required: true,
        min: 0
    },
    currentPrice: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

portfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
