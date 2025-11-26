import React, { useState, useEffect, useRef } from 'react';

function Navbar({ onNavigate, user, onLogout }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [theme, setTheme] = useState('light');
    const dropdownRef = useRef(null);

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        applyTheme(savedTheme);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const applyTheme = (newTheme) => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between whitespace-nowrap border-b border-border-light dark:border-border-dark bg-content-light dark:bg-content-dark px-6 py-3">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-4 text-text-primary-light dark:text-text-primary-dark">
                    <div className="size-6 text-primary">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"></path>
                            <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold tracking-[-0.015em]">Wealthify</h2>
                </div>
                <nav className="hidden md:flex items-center gap-9">
                    <a
                        className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark cursor-pointer"
                        onClick={() => onNavigate('dashboard')}
                    >
                        Dashboard
                    </a>
                    <a
                        className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark cursor-pointer"
                        onClick={() => onNavigate('portfolio')}
                    >
                        Portfolio
                    </a>
                    <a
                        className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark cursor-pointer"
                        onClick={() => onNavigate('watchlist')}
                    >
                        Watchlists
                    </a>
                    <a
                        className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark cursor-pointer"
                        onClick={() => onNavigate('stocks')}
                    >
                        Stocks
                    </a>
                    <a
                        className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark cursor-pointer"
                        onClick={() => onNavigate('sip-calculator')}
                    >
                        SIP Calculator
                    </a>
                </nav>
            </div>
            <div className="flex flex-1 justify-end gap-4 md:gap-8 items-center">
                <label className="hidden sm:flex flex-col min-w-40 !h-10 max-w-64">
                    <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                        <div className="text-text-secondary-light dark:text-text-secondary-dark flex bg-interactive-light dark:bg-interactive-dark items-center justify-center pl-3 rounded-l-lg border-r-0">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-0 focus:ring-0 border-none bg-interactive-light dark:bg-interactive-dark focus:border-none h-full placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal" placeholder="Search" />
                    </div>
                </label>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBOdnZGrHDll105AHLxBpXyFHbO8pIKe0Jo8v4je3oRgHUcoyBenfOjS9koZNKig-AqN5OTCb20pks9aQbpE9jLz6k4bmQ7eAFuzpfOlf5z7cGIkNlQkBnSt4Dy5Sa6DGml-T7Yc7gGNGIpgebFU84PiHXG2tFe7O5OkFBfXkFF2_IEI30zmxGX8qx-G84ht0cblFQ9uaY9HZJv37zag2Mfo5C6aV3UfNb0lUeJoW-bDC-MmvOaHStiEkyUkef4uNyqdBfKMBV2wqQ")' }}
                    ></button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#18222e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-50">
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'user@example.com'}</p>
                            </div>

                            {/* Theme Toggle */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                                            {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        style={{ backgroundColor: theme === 'dark' ? '#136dec' : '#cbd5e1' }}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Settings */}
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    onNavigate('settings');
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">settings</span>
                                <span>Settings</span>
                            </button>

                            {/* Logout */}
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    if (onLogout) onLogout();
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">logout</span>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;
