import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AddPortfolioModal from './AddPortfolioModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function StockCatalogue({ user, token, onLogout, onNavigate }) {
    const [stocks, setStocks] = useState([]);
    const [filteredStocks, setFilteredStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSector, setSelectedSector] = useState('All');
    const [sortBy, setSortBy] = useState('symbol');
    const [sortOrder, setSortOrder] = useState('asc');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Portfolio Modal state
    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [selectedStockForPortfolio, setSelectedStockForPortfolio] = useState(null);

    // Sector mapping is now handled by the backend


    useEffect(() => {
        fetchStocks();
    }, []);

    useEffect(() => {
        filterAndSortStocks();
        setCurrentPage(1); // Reset to first page on filter change
    }, [stocks, searchQuery, selectedSector, sortBy, sortOrder]);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/stocks/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok) {
                // Fetch prices for all stocks
                const stocksWithPrices = await Promise.all(
                    data.stocks.map(async (stock) => {
                        try {
                            const priceResponse = await fetch(`${API_URL}/stocks/price/${stock.symbol}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const priceData = await priceResponse.json();
                            return {
                                ...stock,
                                price: priceData.price || 0,
                                change: priceData.change || 0,
                                changePercent: priceData.changePercent || 0
                            };
                        } catch {
                            return { ...stock, price: 0, change: 0, changePercent: 0 };
                        }
                    })
                );
                setStocks(stocksWithPrices);
            }
        } catch (err) {
            console.error('Error fetching stocks:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortStocks = () => {
        let filtered = [...stocks];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(stock =>
                stock.symbol.toLowerCase().includes(query) ||
                stock.name.toLowerCase().includes(query)
            );
        }

        // Apply sector filter
        if (selectedSector !== 'All') {
            filtered = filtered.filter(stock => stock.sector === selectedSector);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let compareA, compareB;

            switch (sortBy) {
                case 'symbol':
                    compareA = a.symbol;
                    compareB = b.symbol;
                    break;
                case 'name':
                    compareA = a.name;
                    compareB = b.name;
                    break;
                case 'price':
                    compareA = a.price;
                    compareB = b.price;
                    break;
                case 'change':
                    compareA = a.changePercent;
                    compareB = b.changePercent;
                    break;
                default:
                    compareA = a.symbol;
                    compareB = b.symbol;
            }

            if (typeof compareA === 'string') {
                return sortOrder === 'asc'
                    ? compareA.localeCompare(compareB)
                    : compareB.localeCompare(compareA);
            } else {
                return sortOrder === 'asc'
                    ? compareA - compareB
                    : compareB - compareA;
            }
        });

        setFilteredStocks(filtered);
    };

    const handleAddToWatchlist = async (stock) => {
        try {
            const response = await fetch(`${API_URL}/watchlist`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: stock.symbol,
                    companyName: stock.name,
                    exchange: stock.exchange,
                    currentPrice: stock.price,
                    priceChange: stock.change,
                    priceChangePercent: stock.changePercent
                })
            });

            if (response.ok) {
                alert('Added to watchlist successfully!');
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to add to watchlist');
            }
        } catch (err) {
            console.error('Error adding to watchlist:', err);
            alert('Failed to add to watchlist');
        }
    };

    const handleAddToPortfolio = (stock) => {
        setSelectedStockForPortfolio(stock);
        setShowPortfolioModal(true);
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStocks = filteredStocks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const sectors = ['All', 'IT', 'Banking', 'Energy', 'Automobile', 'Pharma', 'FMCG', 'Metals', 'Telecom', 'Infrastructure', 'Power', 'Retail', 'Real Estate', 'Paints', 'Electronics', 'Insurance', 'Finance', 'Industrial'];

    return (
        <div className="font-display bg-background-light dark:bg-background-dark text-[#0d131b] dark:text-gray-200 flex flex-col min-h-screen w-full">
            <Navbar onNavigate={onNavigate} user={user} onLogout={onLogout} />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-bold text-[#0d131b] dark:text-white">Stock Catalogue</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Browse and explore {stocks.length}+ Indian stocks across NSE & BSE
                        </p>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Search Stocks
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by symbol or company name..."
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Sector Filter */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Sector
                                </label>
                                <select
                                    value={selectedSector}
                                    onChange={(e) => setSelectedSector(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                >
                                    {sectors.map(sector => (
                                        <option key={sector} value={sector}>{sector}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Sort By
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                    >
                                        <option value="symbol">Symbol</option>
                                        <option value="name">Name</option>
                                        <option value="price">Price</option>
                                        <option value="change">Change %</option>
                                    </select>
                                    <button
                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <span className="material-symbols-outlined">
                                            {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Filters */}
                        {(searchQuery || selectedSector !== 'All') && (
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
                                {searchQuery && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                        Search: "{searchQuery}"
                                        <button onClick={() => setSearchQuery('')} className="hover:bg-primary/20 rounded-full p-0.5">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </span>
                                )}
                                {selectedSector !== 'All' && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                        Sector: {selectedSector}
                                        <button onClick={() => setSelectedSector('All')} className="hover:bg-primary/20 rounded-full p-0.5">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing <span className="font-semibold text-gray-900 dark:text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStocks.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{filteredStocks.length}</span> stocks
                        </p>
                        <button
                            onClick={fetchStocks}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            Refresh Prices
                        </button>
                    </div>

                    {/* Stock Table */}
                    <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading stocks...</div>
                        ) : filteredStocks.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No stocks found matching your criteria.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Symbol</th>
                                            <th className="px-6 py-3 text-left">Company Name</th>
                                            <th className="px-6 py-3 text-left">Sector</th>
                                            <th className="px-6 py-3 text-left">Exchange</th>
                                            <th className="px-6 py-3 text-right">Price</th>
                                            <th className="px-6 py-3 text-right">Change</th>
                                            <th className="px-6 py-3 text-right">% Change</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentStocks.map((stock) => (
                                            <tr key={stock.symbol} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center">
                                                            <span className="text-primary font-bold text-sm">{stock.symbol.charAt(0)}</span>
                                                        </div>
                                                        <span className="font-bold text-[#0d131b] dark:text-white">{stock.symbol}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{stock.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                                                        {stock.sector}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-primary text-white rounded text-xs font-medium">
                                                        {stock.exchange}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold">
                                                    ₹{stock.price.toFixed(2)}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-medium ${stock.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                    {stock.change >= 0 ? '+' : ''}₹{stock.change.toFixed(2)}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-medium ${stock.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleAddToWatchlist(stock)}
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                            title="Add to Watchlist"
                                                        >
                                                            <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-400">
                                                                visibility
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleAddToPortfolio(stock)}
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                            title="Add to Portfolio"
                                                        >
                                                            <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-400">
                                                                add_circle
                                                            </span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {filteredStocks.length > itemsPerPage && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => paginate(i + 1)}
                                    className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium ${currentPage === i + 1
                                            ? 'bg-primary text-white'
                                            : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Add Portfolio Modal */}
            {showPortfolioModal && (
                <AddPortfolioModal
                    token={token}
                    initialStock={selectedStockForPortfolio}
                    onClose={() => {
                        setShowPortfolioModal(false);
                        setSelectedStockForPortfolio(null);
                    }}
                    onSuccess={() => {
                        setShowPortfolioModal(false);
                        setSelectedStockForPortfolio(null);
                        alert('Added to portfolio successfully!');
                    }}
                />
            )}
        </div>
    );
}

export default StockCatalogue;
