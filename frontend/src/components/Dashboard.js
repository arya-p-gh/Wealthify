import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Dashboard({ user, token, onLogout, onNavigate }) {
  const [timeRange, setTimeRange] = useState('1D');
  const [portfolio, setPortfolio] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortfolioData();
    fetchWatchlistData();
  }, [token]);

  const fetchPortfolioData = async () => {
    if (!token) return;
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
      setError('Network error. Please check if backend is running.');
    }
  };

  const fetchWatchlistData = async () => {
    if (!token) return;
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
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total portfolio value from real data
  const totalPortfolioValue = portfolio.reduce((sum, holding) => {
    return sum + (holding.currentPrice * holding.quantity);
  }, 0);

  // Calculate today's change (simplified - using difference between current and average price)
  const totalChange = portfolio.reduce((sum, holding) => {
    return sum + ((holding.currentPrice - holding.averagePrice) * holding.quantity);
  }, 0);

  const changePercent = totalPortfolioValue > 0
    ? ((totalChange / (totalPortfolioValue - totalChange)) * 100).toFixed(2)
    : 0;


  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-[#0d131b] dark:text-gray-200 flex flex-col min-h-screen w-full overflow-hidden">
      <Navbar onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Page Content */}
        <main className="flex-1 p-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Center Column */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {/* PageHeading */}
              <div>
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0d131b] dark:text-white">Welcome back, {user?.name?.split(' ')[0] || 'Alex'}!</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Here is your portfolio overview for today.</p>
              </div>

              {/* Charts (Portfolio Summary) */}
              <div className="bg-white dark:bg-[#18222e] p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Portfolio Value</p>
                    <p className="text-4xl font-bold text-[#0d131b] dark:text-white mt-1">
                      ₹{loading ? '...' : totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Today's Change</p>
                      <p className={`text-sm font-medium ${totalChange >= 0 ? 'text-positive' : 'text-negative'} flex items-center gap-1`}>
                        <span className="material-symbols-outlined text-base">
                          {totalChange >= 0 ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                        <span>
                          {totalChange >= 0 ? '+' : ''}₹{Math.abs(totalChange).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalChange >= 0 ? '+' : ''}{changePercent}%)
                        </span>
                      </p>
                    </div>
                  </div>
                  {/* SegmentedButtons */}
                  <div className="flex h-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                    {['1D', '1W', '1M', '1Y'].map((range) => (
                      <label key={range} className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-3 ${timeRange === range ? 'bg-white dark:bg-gray-700 shadow-sm text-[#0d131b] dark:text-white' : 'text-gray-600 dark:text-gray-300'} text-sm font-medium`}>
                        <span className="truncate">{range}</span>
                        <input
                          checked={timeRange === range}
                          className="sr-only"
                          name="time-range"
                          type="radio"
                          value={range}
                          onChange={() => setTimeRange(range)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="h-64 mt-6">
                  <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="0 0 475 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z" fill="url(#chart-gradient)"></path>
                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#136dec" strokeLinecap="round" strokeWidth="2"></path>
                    <defs>
                      <linearGradient gradientUnits="userSpaceOnUse" id="chart-gradient" x1="236" x2="236" y1="1" y2="149">
                        <stop stopColor="#136dec" stopOpacity="0.2"></stop>
                        <stop offset="1" stopColor="#136dec" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Portfolio Holdings Table */}
              <div className="bg-white dark:bg-[#18222e] p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#0d131b] dark:text-white">Portfolio Holdings</h3>
                  <a className="text-sm font-medium text-primary hover:underline" href="#" onClick={(e) => { e.preventDefault(); onNavigate('portfolio'); }}>View All</a>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading portfolio...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : portfolio.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No holdings yet. Start building your portfolio!</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="py-3 px-4">Company</th>
                          <th className="py-3 px-4 text-right">Quantity</th>
                          <th className="py-3 px-4 text-right">Price</th>
                          <th className="py-3 px-4 text-right">Day's Change</th>
                          <th className="py-3 px-4 text-right">Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.slice(0, 4).map((holding) => {
                          const dayChange = (holding.currentPrice - holding.averagePrice) * holding.quantity;
                          const dayChangePercent = holding.averagePrice > 0
                            ? (((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100).toFixed(2)
                            : 0;
                          const totalValue = holding.currentPrice * holding.quantity;

                          return (
                            <tr key={holding._id} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-4 px-4 font-medium">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary/10 rounded-full size-8 flex items-center justify-center">
                                    <span className="text-primary font-bold text-sm">{holding.symbol.charAt(0)}</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#0d131b] dark:text-white">{holding.companyName}</p>
                                    <p className="text-xs text-gray-500">{holding.symbol}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">{holding.quantity}</td>
                              <td className="py-4 px-4 text-right">₹{holding.currentPrice.toFixed(2)}</td>
                              <td className={`py-4 px-4 text-right font-medium ${dayChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                                {dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)} ({dayChange >= 0 ? '+' : ''}{dayChangePercent}%)
                              </td>
                              <td className="py-4 px-4 text-right font-semibold">₹{totalValue.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Market Summary - Indian Indices */}
              <div>
                <h3 className="text-lg font-semibold text-[#0d131b] dark:text-white mb-4">Indian Market Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-[#18222e] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">NIFTY 50</p>
                    <p className="text-lg font-bold mt-1">21,456.75</p>
                    <p className="text-sm font-medium text-positive">+145.30 (+0.68%)</p>
                  </div>
                  <div className="bg-white dark:bg-[#18222e] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">SENSEX</p>
                    <p className="text-lg font-bold mt-1">71,234.58</p>
                    <p className="text-sm font-medium text-positive">+523.45 (+0.74%)</p>
                  </div>
                  <div className="bg-white dark:bg-[#18222e] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">BANK NIFTY</p>
                    <p className="text-lg font-bold mt-1">45,678.90</p>
                    <p className="text-sm font-medium text-negative">-234.12 (-0.51%)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-12 lg:col-span-4 space-y-8">


              {/* Watchlist */}
              <div className="bg-white dark:bg-[#18222e] p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-[#0d131b] dark:text-white mb-4">My Watchlist</h3>
                {loading ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : watchlist.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No stocks in watchlist yet.</div>
                ) : (
                  <div className="space-y-4">
                    {watchlist.slice(0, 3).map((item) => (
                      <div key={item._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-full size-8 flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">{item.symbol.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#0d131b] dark:text-white">{item.symbol}</p>
                            <p className="text-xs text-gray-500">{item.companyName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">₹{item.currentPrice.toFixed(2)}</p>
                          <p className={`text-sm font-medium ${item.priceChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(2)} ({item.priceChange >= 0 ? '+' : ''}{item.priceChangePercent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Performing Stocks */}
              <div className="bg-white dark:bg-[#18222e] p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-[#0d131b] dark:text-white mb-4">Top Performers</h3>
                {loading ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : (
                  <div className="space-y-4">
                    {/* Sort watchlist by highest percentage gain and show top 3 */}
                    {[...watchlist]
                      .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
                      .slice(0, 3)
                      .map((item) => (
                        <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-center gap-3">
                            <div className="bg-positive/10 rounded-full size-10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-positive text-xl">trending_up</span>
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#0d131b] dark:text-white">{item.symbol}</p>
                              <p className="text-xs text-gray-500">{item.companyName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">₹{item.currentPrice.toFixed(2)}</p>
                            <p className="text-sm font-bold text-positive">
                              +{item.priceChangePercent.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    {watchlist.length === 0 && (
                      <p className="text-center text-gray-500 text-sm py-4">
                        Add stocks to your watchlist to see top performers
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
