import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AddPortfolioModal from './AddPortfolioModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Portfolio({ user, token, onLogout, onNavigate }) {
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editHolding, setEditHolding] = useState(null);

    useEffect(() => {
        fetchPortfolio();
    }, [token]);

    const fetchPortfolio = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/portfolio`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok) {
                setPortfolio(data.holdings || []);
            } else {
                setError(data.message || 'Failed to fetch portfolio');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (holdingId) => {
        // Removed confirmation dialog for seamless experience

        try {
            const response = await fetch(`${API_URL}/portfolio/${holdingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchPortfolio();
            } else {
                alert('Failed to delete holding');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const totalValue = portfolio.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    const totalInvested = portfolio.reduce((sum, h) => sum + (h.averagePrice * h.quantity), 0);
    const totalPL = totalValue - totalInvested;
    const totalPLPercent = totalInvested > 0 ? ((totalPL / totalInvested) * 100).toFixed(2) : 0;

    return (
        <div className="font-display bg-background-light dark:bg-background-dark text-[#0d131b] dark:text-gray-200 flex flex-col min-h-screen w-full">
            <Navbar onNavigate={onNavigate} user={user} onLogout={onLogout} />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-4xl font-bold text-[#0d131b] dark:text-white">Your Portfolio</h1>
                        <button
                            onClick={() => { setEditHolding(null); setShowAddModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined">add</span>
                            <span>Add Holding</span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-[#18222e] p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Value</p>
                            <p className="text-3xl font-bold text-[#0d131b] dark:text-white mt-1">
                                ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-[#18222e] p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Invested</p>
                            <p className="text-3xl font-bold text-[#0d131b] dark:text-white mt-1">
                                ₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-[#18222e] p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total P/L</p>
                            <p className={`text-3xl font-bold mt-1 ${totalPL >= 0 ? 'text-positive' : 'text-negative'}`}>
                                {totalPL >= 0 ? '+' : ''}₹{Math.abs(totalPL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className={`text-sm font-medium ${totalPL >= 0 ? 'text-positive' : 'text-negative'}`}>
                                {totalPL >= 0 ? '+' : ''}{totalPLPercent}%
                            </p>
                        </div>
                    </div>

                    {/* Holdings Table */}
                    <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="text-xl font-bold text-[#0d131b] dark:text-white">Holdings</h2>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading portfolio...</div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-500">{error}</div>
                        ) : portfolio.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No holdings yet. Click "Add Holding" to start building your portfolio!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Stock</th>
                                            <th className="px-6 py-3 text-right">Quantity</th>
                                            <th className="px-6 py-3 text-right">Avg. Price</th>
                                            <th className="px-6 py-3 text-right">Current Price</th>
                                            <th className="px-6 py-3 text-right">Current Value</th>
                                            <th className="px-6 py-3 text-right">Total P/L</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.map((holding) => {
                                            const currentValue = holding.currentPrice * holding.quantity;
                                            const invested = holding.averagePrice * holding.quantity;
                                            const pl = currentValue - invested;
                                            const plPercent = invested > 0 ? ((pl / invested) * 100).toFixed(2) : 0;

                                            return (
                                                <tr key={holding._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center">
                                                                <span className="text-primary font-bold">{holding.symbol.charAt(0)}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[#0d131b] dark:text-white">{holding.symbol}</p>
                                                                <p className="text-xs text-gray-500">{holding.companyName}</p>
                                                                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded mt-0.5 inline-block">
                                                                    {holding.exchange || 'NSE'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">{holding.quantity}</td>
                                                    <td className="px-6 py-4 text-right">₹{holding.averagePrice.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-right">₹{holding.currentPrice.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-right font-semibold">₹{currentValue.toFixed(2)}</td>
                                                    <td className={`px-6 py-4 text-right font-medium ${pl >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                        {pl >= 0 ? '+' : ''}₹{Math.abs(pl).toFixed(2)} ({pl >= 0 ? '+' : ''}{plPercent}%)
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => { setEditHolding(holding); setShowAddModal(true); }}
                                                                className="text-primary hover:text-primary/80"
                                                                title="Edit"
                                                            >
                                                                <span className="material-symbols-outlined text-xl">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(holding._id)}
                                                                className="text-red-500 hover:text-red-600"
                                                                title="Delete"
                                                            >
                                                                <span className="material-symbols-outlined text-xl">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <AddPortfolioModal
                    token={token}
                    editHolding={editHolding}
                    onClose={() => { setShowAddModal(false); setEditHolding(null); }}
                    onSuccess={() => { setShowAddModal(false); setEditHolding(null); fetchPortfolio(); }}
                />
            )}
        </div>
    );
}

export default Portfolio;
