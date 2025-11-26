import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AddWatchlistModal from './AddWatchlistModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Watchlist({ user, token, onLogout, onNavigate }) {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchWatchlist();
    }, [token]);

    const fetchWatchlist = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/watchlist`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok) {
                setWatchlist(data.items || []);
            } else {
                setError(data.message || 'Failed to fetch watchlist');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        // Removed confirmation dialog for seamless experience

        try {
            const response = await fetch(`${API_URL}/watchlist/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchWatchlist();
            } else {
                alert('Failed to remove stock');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    return (
        <div className="font-display bg-background-light dark:bg-background-dark text-[#0d131b] dark:text-gray-200 flex flex-col min-h-screen w-full">
            <Navbar onNavigate={onNavigate} user={user} onLogout={onLogout} />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-[#0d131b] dark:text-white">Watchlist</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Track your favorite Indian stocks</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined">add</span>
                            <span>Add Stock</span>
                        </button>
                    </div>

                    {/* Watchlist Table */}
                    <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading watchlist...</div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-500">{error}</div>
                        ) : watchlist.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No stocks in watchlist yet. Click "Add Stock" to start tracking!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Stock</th>
                                            <th className="px-6 py-3 text-right">Last Price</th>
                                            <th className="px-6 py-3 text-right">Change</th>
                                            <th className="px-6 py-3 text-right">% Change</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {watchlist.map((item) => (
                                            <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center">
                                                            <span className="text-primary font-bold">{item.symbol.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#0d131b] dark:text-white">{item.symbol}</p>
                                                            <p className="text-xs text-gray-500">{item.companyName}</p>
                                                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded mt-0.5 inline-block">
                                                                {item.exchange || 'NSE'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold">
                                                    ₹{item.currentPrice.toFixed(2)}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-medium ${item.priceChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                    {item.priceChange >= 0 ? '+' : ''}₹{item.priceChange.toFixed(2)}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-medium ${item.priceChangePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                    {item.priceChangePercent >= 0 ? '+' : ''}{item.priceChangePercent.toFixed(2)}%
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="text-red-500 hover:text-red-600"
                                                        title="Remove"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Add Modal */}
            {showAddModal && (
                <AddWatchlistModal
                    token={token}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { setShowAddModal(false); fetchWatchlist(); }}
                />
            )}
        </div>
    );
}

export default Watchlist;
