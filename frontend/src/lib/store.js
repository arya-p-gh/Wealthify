// Demo data layer: holdings, watchlist, goals and profile live in this browser's
// localStorage. Nothing personal is ever sent to the server — the API is only used
// for public market data (prices and charts).
//
// It answers the same paths the old account-based API did (/portfolio, /watchlist,
// /goals, /auth/me, /auth/profile) so pages keep calling api() unchanged.

const KEY = 'wealthify:demo:v1';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const now = () => new Date().toISOString();
const monthsFromNow = (m) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m, 1);
  return d.toISOString();
};

const DEFAULT_PROFILE = {
  id: 'demo',
  name: 'Demo Investor',
  email: 'demo@wealthify.local',
  phone: '',
  bio: '',
  location: '',
  occupation: '',
  riskProfile: 'moderate',
  monthlyIncome: 0,
};

const SECTOR = {
  'TCS.BO': 'IT', 'INFY.BO': 'IT', 'HDFCBANK.BO': 'Banking', 'ICICIBANK.BO': 'Banking', 'RELIANCE.BO': 'Energy',
  'SUNPHARMA.BO': 'Pharma', 'TITAN.BO': 'Retail', 'ITC.BO': 'FMCG', 'BAJFINANCE.BO': 'Finance', 'TMPV.BO': 'Automobile',
};

function sampleData() {
  const holding = (symbol, companyName, quantity, averagePrice, monthsAgo) => ({
    _id: uid(), symbol, companyName, exchange: 'BSE', sector: SECTOR[symbol] || 'Other', quantity, averagePrice,
    currentPrice: averagePrice, previousClose: averagePrice, buyDate: monthsFromNow(-monthsAgo), notes: '', createdAt: now(),
  });
  const watch = (symbol, companyName) => ({
    _id: uid(), symbol, companyName, exchange: 'BSE', sector: SECTOR[symbol] || 'Other', currentPrice: 0, priceChange: 0,
    priceChangePercent: 0, alertAbove: null, alertBelow: null, note: '', addedAt: now(),
  });
  return {
    profile: { ...DEFAULT_PROFILE, createdAt: now() },
    holdings: [
      holding('TCS.BO', 'Tata Consultancy Services Ltd', 12, 3100, 18),
      holding('HDFCBANK.BO', 'HDFC Bank Ltd', 40, 1450, 14),
      holding('RELIANCE.BO', 'Reliance Industries Ltd', 25, 1250, 11),
      holding('INFY.BO', 'Infosys Ltd', 30, 1500, 9),
      holding('SUNPHARMA.BO', 'Sun Pharmaceutical Industries Ltd', 15, 1100, 7),
      holding('TITAN.BO', 'Titan Company Ltd', 8, 2900, 5),
      holding('ICICIBANK.BO', 'ICICI Bank Ltd', 35, 900, 3),
    ],
    watchlist: [watch('TMPV.BO', 'Tata Motors Passenger Vehicles Ltd'), watch('ITC.BO', 'ITC Ltd'), watch('BAJFINANCE.BO', 'Bajaj Finance Ltd')],
    goals: [
      { _id: uid(), title: 'Dream home', category: 'home', emoji: '🏡', targetAmount: 6000000, savedAmount: 1400000, targetDate: monthsFromNow(68), expectedReturn: 12, createdAt: now() },
      { _id: uid(), title: 'Japan trip', category: 'travel', emoji: '✈️', targetAmount: 400000, savedAmount: 310000, targetDate: monthsFromNow(6), expectedReturn: 7, createdAt: now() },
    ],
  };
}

function emptyData() {
  return { profile: { ...DEFAULT_PROFILE, name: 'Investor', createdAt: now() }, holdings: [], watchlist: [], goals: [] };
}

// ---------- persistence ----------
let cache;
function read() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY));
  } catch {
    cache = null;
  }
  return cache;
}
function write(db) {
  cache = db;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked — keep working in memory for this tab */
  }
  return db;
}

// Persist changes made by the local API, but only if that session is still the current
// one — a request that finishes after a reset or "Delete all data" must not bring it back.
const save = (data) => {
  if (read() === data) write(data);
};

export const hasDemo = () => Boolean(read());
export const startDemo = (mode = 'sample') => write(mode === 'empty' ? emptyData() : sampleData());
export const clearDemo = () => {
  cache = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
export const getProfile = () => read()?.profile ?? null;

// ---------- helpers ----------
const fail = (message) => {
  throw new Error(message);
};
const ticker = (s) => s.replace(/\.(BO|NS)$/, '');
const parse = (path) => {
  const [p, qs = ''] = path.split('?');
  const parts = p.split('/').filter(Boolean);
  return { parts, query: Object.fromEntries(new URLSearchParams(qs)) };
};
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

// Pull live quotes for a list of symbols from the market API
async function livePrices(remote, symbols, signal) {
  if (!symbols.length) return {};
  try {
    const { results = [] } = await remote('/stocks/prices', { method: 'POST', body: { symbols }, signal });
    return Object.fromEntries(results.filter((r) => r.success).map((r) => [r.symbol, r.data]));
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return {}; // offline: fall back to the last stored prices
  }
}

// ---------- local "API" ----------
export const isLocalPath = (path) => /^\/(portfolio|watchlist|goals|auth)(\/|\?|$)/.test(path);

export async function localApi(path, { method = 'GET', body = {}, signal } = {}, remote) {
  const { parts, query } = parse(path);
  const [resource, id] = parts;
  // No session (never started, or just deleted): refuse rather than silently re-creating
  // data, e.g. when a background refresh finishes after "Delete all data".
  const data = read();
  if (!data) fail('Start the demo first');

  // ----- profile -----
  if (resource === 'auth') {
    if (id === 'me') return { user: data.profile };
    if (id === 'profile' && method === 'PUT') {
      data.profile = { ...data.profile, ...pick(body, ['name', 'email', 'phone', 'bio', 'location', 'occupation', 'riskProfile', 'monthlyIncome']) };
      save(data);
      return { message: 'Profile updated', user: data.profile };
    }
    fail('Not available in demo mode');
  }

  // ----- portfolio -----
  if (resource === 'portfolio') {
    if (id === 'history' && method === 'GET') {
      if (!data.holdings.length) return { points: [] };
      return remote('/stocks/portfolio-history', {
        method: 'POST',
        signal,
        body: { range: query.range || '1M', holdings: data.holdings.map((h) => pick(h, ['symbol', 'quantity', 'currentPrice', 'averagePrice'])) },
      });
    }
    if (method === 'GET') {
      if (query.refresh !== '0') {
        const quotes = await livePrices(remote, data.holdings.map((h) => h.symbol), signal);
        data.holdings.forEach((h) => {
          const q = quotes[h.symbol];
          if (q?.price) Object.assign(h, { currentPrice: q.price, previousClose: q.previousClose, sector: q.sector || h.sector, lastUpdated: now() });
        });
        save(data);
      }
      return { holdings: [...data.holdings].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)) };
    }
    if (method === 'POST') {
      const { symbol, companyName, quantity, averagePrice, currentPrice, exchange, buyDate, notes, sector } = body;
      if (!symbol || !companyName || !(quantity > 0) || !(averagePrice > 0)) fail('Symbol, quantity and average price are required');
      const sym = symbol.toUpperCase();
      const existing = data.holdings.find((h) => h.symbol === sym);
      if (existing) {
        const qty = existing.quantity + Number(quantity);
        existing.averagePrice = (existing.averagePrice * existing.quantity + Number(averagePrice) * Number(quantity)) / qty;
        existing.quantity = qty;
        if (currentPrice) existing.currentPrice = currentPrice;
        save(data);
        return { message: `Added ${quantity} more shares to ${ticker(sym)}`, holding: existing, merged: true };
      }
      const live = (await livePrices(remote, [sym], signal))[sym];
      const holding = {
        _id: uid(), symbol: sym, companyName, exchange: exchange === 'NSE' ? 'NSE' : 'BSE', sector: sector || live?.sector || SECTOR[sym] || 'Other',
        quantity: Number(quantity), averagePrice: Number(averagePrice), currentPrice: currentPrice || Number(averagePrice),
        previousClose: currentPrice || Number(averagePrice), buyDate: buyDate || now(), notes: notes || '', createdAt: now(),
      };
      data.holdings.push(holding);
      save(data);
      return { message: 'Holding added', holding };
    }
    const h = data.holdings.find((x) => x._id === id) || fail('Holding not found');
    if (method === 'PUT') {
      Object.assign(h, pick(body, ['quantity', 'averagePrice', 'currentPrice', 'buyDate', 'notes']));
      save(data);
      return { message: 'Holding updated', holding: h };
    }
    if (method === 'DELETE') {
      data.holdings = data.holdings.filter((x) => x !== h);
      save(data);
      return { message: 'Holding deleted' };
    }
  }

  // ----- watchlist -----
  if (resource === 'watchlist') {
    if (method === 'GET') {
      const items = data.watchlist;
      if (items.length && query.refresh !== '0') {
        const quotes = await livePrices(remote, items.map((i) => i.symbol), signal);
        items.forEach((it) => {
          const q = quotes[it.symbol];
          if (q?.price) Object.assign(it, { currentPrice: q.price, priceChange: q.change, priceChangePercent: q.changePercent, spark: q.spark, sector: q.sector || it.sector });
        });
        save(data);
      }
      items.forEach((it) => {
        it.alertTriggered =
          (it.alertAbove != null && it.currentPrice >= it.alertAbove) || (it.alertBelow != null && it.currentPrice > 0 && it.currentPrice <= it.alertBelow);
      });
      return { items: [...items].sort((a, b) => (b.addedAt > a.addedAt ? 1 : -1)) };
    }
    if (method === 'POST') {
      const { symbol, companyName, currentPrice, priceChange, priceChangePercent, exchange, sector } = body;
      if (!symbol || !companyName) fail('Missing required fields: symbol, companyName');
      const sym = symbol.toUpperCase();
      if (data.watchlist.some((w) => w.symbol === sym)) fail('Already in your watchlist');
      const live = currentPrice ? null : (await livePrices(remote, [sym], signal))[sym];
      const item = {
        _id: uid(), symbol: sym, companyName, exchange: exchange === 'NSE' ? 'NSE' : 'BSE', sector: sector || live?.sector || SECTOR[sym] || 'Other',
        currentPrice: currentPrice || live?.price || 0, priceChange: priceChange ?? live?.change ?? 0, priceChangePercent: priceChangePercent ?? live?.changePercent ?? 0,
        alertAbove: null, alertBelow: null, note: '', addedAt: now(),
      };
      data.watchlist.push(item);
      save(data);
      return { message: 'Added to watchlist', item };
    }
    const it = data.watchlist.find((x) => x._id === id) || fail('Watchlist item not found');
    if (method === 'PUT') {
      ['currentPrice', 'priceChange', 'priceChangePercent', 'alertAbove', 'alertBelow', 'note'].forEach((k) => {
        if (body[k] !== undefined) it[k] = body[k] === '' ? null : body[k];
      });
      save(data);
      return { message: 'Watchlist updated', item: it };
    }
    if (method === 'DELETE') {
      data.watchlist = data.watchlist.filter((x) => x !== it);
      save(data);
      return { message: 'Removed from watchlist' };
    }
  }

  // ----- goals -----
  if (resource === 'goals') {
    const FIELDS = ['title', 'emoji', 'category', 'targetAmount', 'savedAmount', 'targetDate', 'expectedReturn'];
    if (method === 'GET') return { goals: [...data.goals].sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate)) };
    if (method === 'POST') {
      const g = { emoji: '🎯', category: 'other', savedAmount: 0, expectedReturn: 12, ...pick(body, FIELDS), _id: uid(), createdAt: now() };
      if (!g.title || !(Number(g.targetAmount) > 0) || !g.targetDate) fail('Title, target amount and date are required');
      data.goals.push(g);
      save(data);
      return { message: 'Goal created', goal: g };
    }
    const g = data.goals.find((x) => x._id === id) || fail('Goal not found');
    if (method === 'PUT') {
      Object.assign(g, pick(body, FIELDS));
      save(data);
      return { message: 'Goal updated', goal: g };
    }
    if (method === 'DELETE') {
      data.goals = data.goals.filter((x) => x !== g);
      save(data);
      return { message: 'Goal deleted' };
    }
  }

  fail('Not found');
}
