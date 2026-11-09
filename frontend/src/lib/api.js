import { isLocalPath, localApi } from './store';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
    throw new Error("Can't reach the market data server. Is the backend running?");
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
