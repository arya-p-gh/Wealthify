import { isLocalPath, localApi } from './store';

// The market-data API is served from the same site (/api), so nothing needs configuring.
// VITE_API_URL is only an optional override for pointing at another server.
export const API_URL = import.meta.env.VITE_API_URL || '/api';

// Public market-data API (prices, charts, search). No accounts, no auth headers.
async function remote(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error("Can't reach the market data service. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// Portfolio, watchlist, goals and profile are answered from this browser's storage.
export async function api(path, opts = {}) {
  if (isLocalPath(path)) return structuredClone(await localApi(path, opts, remote));
  return remote(path, opts);
}
