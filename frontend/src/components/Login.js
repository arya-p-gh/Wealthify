import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Login({ onLoginSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-10">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <svg className="w-9 h-9 text-[#136dec]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-3xl font-bold text-white">Wealthify</span>
          </div>
          <p className="text-[#A1A1AA]">Access your portfolio with ease and elegance.</p>
        </div>
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-8 md:p-10">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-6">
              <h1 className="text-2xl font-bold text-white">Sign In</h1>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="w-full space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#A1A1AA]" htmlFor="email">
                    Email 
                  </label>
                  <input
                    className="flex h-12 w-full rounded-lg border border-[#27272A] bg-[#0a0a0a] px-4 py-2 text-base text-white placeholder:text-[#A1A1AA] focus:border-[#136dec] focus:ring-2 focus:ring-[#136dec]/50 transition-all outline-none"
                    id="email"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-[#A1A1AA]" htmlFor="password">
                      Password
                    </label>
                    <button type="button" className="text-sm font-medium text-[#136dec] hover:underline underline-offset-4">
                      Forgot password?
                    </button>
                  </div>
                  <input
                    className="flex h-12 w-full rounded-lg border border-[#27272A] bg-[#0a0a0a] px-4 py-2 text-base text-white placeholder:text-[#A1A1AA] focus:border-[#136dec] focus:ring-2 focus:ring-[#136dec]/50 transition-all outline-none"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex w-full flex-col space-y-4 pt-2">
                <button
                  className="flex h-12 w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#136dec] text-white text-base font-bold leading-normal tracking-wide transition-colors hover:bg-[#136dec]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="truncate">Sign In</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="text-center text-sm text-[#A1A1AA]">
          <span>Don't have an account?</span>
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="ml-1 font-medium text-[#136dec] hover:underline underline-offset-4"
          >
            Sign up now
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
