import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function AddPortfolioModal({ token, onClose, onSuccess, editHolding, initialStock }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If editing or initial stock provided, populate fields
    useEffect(() => {
        if (editHolding) {
            setSelectedStock({
                symbol: editHolding.symbol,
                name: editHolding.companyName,
                exchange: editHolding.exchange || 'NSE'
            });
            setQuantity(editHolding.quantity.toString());
            setAveragePrice(editHolding.averagePrice.toString());
        } else if (initialStock) {
            setSelectedStock(initialStock);
            // Fetch price for initial stock
            fetch(`${API_URL}/stocks/price/${initialStock.symbol}`)
                .then(res => res.json())
                .then(data => {
                    if (data.price) setAveragePrice(data.price.toString());
                })
                .catch(err => console.error('Error fetching price:', err));
        }
    }, [editHolding, initialStock]);

    // Search stocks as user types
    useEffect(() => {
        if (searchQuery.length >= 2 && !selectedStock) {
            const timer = setTimeout(() => {
                searchStocks();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const searchStocks = async () => {
        try {
            const response = await fetch(`${API_URL}/stocks/search?q=${searchQuery}`);
            const data = await response.json();
            setSearchResults(data.stocks || []);
        } catch (err) {
            console.error('Search error:', err);
        }
    };

    const selectStock = async (stock) => {
        setSelectedStock(stock);
        setSearchQuery('');
        setSearchResults([]);

        // Fetch current price
        try {
            const response = await fetch(`${API_URL}/stocks/price/${stock.symbol}`);
            const data = await response.json();
            if (!averagePrice) {
                setAveragePrice(data.price.toString());
            }
        } catch (err) {
            console.error('Price fetch error:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!selectedStock || !quantity || !averagePrice) {
            setError('Please fill all fields');
            setLoading(false);
            return;
        }

        try {
            const method = editHolding ? 'PUT' : 'POST';
            const url = editHolding
                ? `${API_URL}/portfolio/${editHolding._id}`
                : `${API_URL}/portfolio`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: selectedStock.symbol,
                    companyName: selectedStock.name,
                    exchange: selectedStock.exchange,
                    quantity: parseFloat(quantity),
                    averagePrice: parseFloat(averagePrice),
                    currentPrice: parseFloat(averagePrice)
                })
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess();
            } else {
                setError(data.message || 'Failed to save holding');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#18222e] rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-[#0d131b] dark:text-white">
                        {editHolding ? 'Edit' : 'Add'} Portfolio Holding
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Stock Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search Indian Stock
                        </label>
                        {selectedStock ? (
                            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                                <div>
                                    <p className="font-bold text-[#0d131b] dark:text-white">{selectedStock.symbol}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStock.name}</p>
                                    <span className="text-xs bg-primary text-white px-2 py-0.5 rounded mt-1 inline-block">
                                        {selectedStock.exchange}
                                    </span>
                                </div>
                                {!editHolding && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStock(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by symbol or company name..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d131b] dark:text-white"
                                    disabled={editHolding}
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                                        {searchResults.map((stock) => (
                                            <button
                                                key={stock.symbol}
                                                type="button"
                                                onClick={() => selectStock(stock)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-0"
                                            >
                                                <p className="font-bold text-[#0d131b] dark:text-white">{stock.symbol}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
                                                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded mt-1 inline-block">
                                                    {stock.exchange}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quantity
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            min="0"
                            step="1"
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d131b] dark:text-white"
                        />
                    </div>

                    {/* Average Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Average Price (₹)
                        </label>
                        <input
                            type="number"
                            value={averagePrice}
                            onChange={(e) => setAveragePrice(e.target.value)}
                            placeholder="Enter average price"
                            min="0"
                            step="0.01"
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#0d131b] dark:text-white"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedStock}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : (editHolding ? 'Update' : 'Add')} Holding
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddPortfolioModal;
