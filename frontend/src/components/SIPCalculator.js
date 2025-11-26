import React, { useState } from 'react';
import Navbar from './Navbar';

function SIPCalculator({ user, onLogout, onNavigate }) {
    const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [timePeriod, setTimePeriod] = useState(10);

    // Calculate SIP returns
    const calculateSIP = () => {
        const monthlyRate = expectedReturn / 12 / 100;
        const months = timePeriod * 12;

        // Future Value of SIP formula: FV = P × [(1 + r)^n - 1] / r × (1 + r)
        const futureValue = monthlyInvestment *
            (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));

        const totalInvestment = monthlyInvestment * months;
        const estimatedReturns = futureValue - totalInvestment;

        return {
            futureValue: Math.round(futureValue),
            totalInvestment: Math.round(totalInvestment),
            estimatedReturns: Math.round(estimatedReturns)
        };
    };

    const results = calculateSIP();

    return (
        <div className="font-display bg-background-light dark:bg-background-dark text-[#0d131b] dark:text-gray-200 flex flex-col min-h-screen w-full">
            <Navbar onNavigate={onNavigate} user={user} onLogout={onLogout} />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-bold text-[#0d131b] dark:text-white">SIP Calculator</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Calculate returns on your Systematic Investment Plan
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Input Section */}
                        <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                            <h2 className="text-xl font-bold text-[#0d131b] dark:text-white mb-6">Investment Details</h2>

                            <div className="space-y-6">
                                {/* Monthly Investment */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Monthly Investment
                                        </label>
                                        <span className="text-lg font-bold text-primary">
                                            ₹{monthlyInvestment.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="500"
                                        max="100000"
                                        step="500"
                                        value={monthlyInvestment}
                                        onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span>₹500</span>
                                        <span>₹1,00,000</span>
                                    </div>
                                </div>

                                {/* Expected Return Rate */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Expected Return Rate (p.a.)
                                        </label>
                                        <span className="text-lg font-bold text-primary">
                                            {expectedReturn}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        step="0.5"
                                        value={expectedReturn}
                                        onChange={(e) => setExpectedReturn(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span>1%</span>
                                        <span>30%</span>
                                    </div>
                                </div>

                                {/* Time Period */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Time Period
                                        </label>
                                        <span className="text-lg font-bold text-primary">
                                            {timePeriod} {timePeriod === 1 ? 'Year' : 'Years'}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="40"
                                        step="1"
                                        value={timePeriod}
                                        onChange={(e) => setTimePeriod(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span>1 Yr</span>
                                        <span>40 Yrs</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Presets</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => { setMonthlyInvestment(5000); setExpectedReturn(12); setTimePeriod(10); }}
                                        className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                                    >
                                        Conservative
                                    </button>
                                    <button
                                        onClick={() => { setMonthlyInvestment(10000); setExpectedReturn(15); setTimePeriod(15); }}
                                        className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                                    >
                                        Moderate
                                    </button>
                                    <button
                                        onClick={() => { setMonthlyInvestment(20000); setExpectedReturn(18); setTimePeriod(20); }}
                                        className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                                    >
                                        Aggressive
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results Section */}
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white">
                                <p className="text-sm opacity-90 mb-1">Estimated Returns</p>
                                <p className="text-4xl font-bold">
                                    ₹{results.futureValue.toLocaleString('en-IN')}
                                </p>
                                <p className="text-sm opacity-75 mt-2">
                                    Total value after {timePeriod} {timePeriod === 1 ? 'year' : 'years'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Investment</p>
                                    <p className="text-2xl font-bold text-[#0d131b] dark:text-white">
                                        ₹{results.totalInvestment.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Est. Returns</p>
                                    <p className="text-2xl font-bold text-positive">
                                        ₹{results.estimatedReturns.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                                <h3 className="text-lg font-bold text-[#0d131b] dark:text-white mb-4">Investment Breakdown</h3>

                                {/* Visual Bar */}
                                <div className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4">
                                    <div
                                        className="absolute h-full bg-primary/30 dark:bg-primary/40"
                                        style={{ width: `${(results.totalInvestment / results.futureValue) * 100}%` }}
                                    ></div>
                                    <div
                                        className="absolute h-full bg-positive"
                                        style={{
                                            left: `${(results.totalInvestment / results.futureValue) * 100}%`,
                                            width: `${(results.estimatedReturns / results.futureValue) * 100}%`
                                        }}
                                    ></div>
                                </div>

                                {/* Legend */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-primary/30 dark:bg-primary/40"></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Invested Amount</span>
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {((results.totalInvestment / results.futureValue) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-positive"></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Returns</span>
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {((results.estimatedReturns / results.futureValue) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                <div className="flex gap-2">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">info</span>
                                    <div className="text-sm text-blue-800 dark:text-blue-300">
                                        <p className="font-semibold mb-1">Note:</p>
                                        <p className="text-xs leading-relaxed">
                                            This calculator provides an estimate based on the expected rate of return.
                                            Actual returns may vary depending on market conditions and fund performance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-xl font-bold text-[#0d131b] dark:text-white mb-4">Why SIP?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">trending_up</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#0d131b] dark:text-white mb-1">Rupee Cost Averaging</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Invest regularly regardless of market conditions, reducing the impact of volatility.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">savings</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#0d131b] dark:text-white mb-1">Disciplined Investing</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Build wealth systematically with automated monthly investments.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">account_balance</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#0d131b] dark:text-white mb-1">Power of Compounding</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Earn returns on your returns, accelerating wealth creation over time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SIPCalculator;
