// /api request handler shared by the Vercel function (api/market.js) and the Vite
// dev/preview server (vite.config.js). Plain Node req/res, no framework.

import * as market from './market.js';

const send = (res, status, body, cache) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Let Vercel's CDN serve repeat requests so Yahoo isn't hit on every page view
  res.setHeader('Cache-Control', cache ? `public, max-age=0, s-maxage=${cache}, stale-while-revalidate=600` : 'no-store');
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new Error('Body too large');
  }
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  // On Vercel, vercel.json rewrites /api/<path> to /api/market?path=<path>
  const path = '/' + (url.searchParams.get('path') ?? url.pathname.replace(/^\/api\/?/, '').replace(/^\//, '')).replace(/\/+$/, '');
  const q = url.searchParams;
  const [, group, action, arg] = path.split('/'); // ['', 'stocks', 'quote', 'TCS.BO']
  const symbol = arg ? decodeURIComponent(arg) : '';

  try {
    if (path === '/health') return send(res, 200, { ok: true });
    if (group !== 'stocks') return send(res, 404, { message: 'Not found' });

    if (req.method === 'GET') {
      switch (action) {
        case 'search':
          return send(res, 200, { stocks: market.searchStocks(q.get('q') || '') }, 3600);
        case 'list':
          return send(res, 200, { stocks: market.INDIAN_STOCKS }, 3600);
        case 'indices':
          return send(res, 200, { indices: await market.getIndices() }, 60);
        case 'market':
          return send(res, 200, await market.getMarket(), 60);
        case 'price':
        case 'quote':
          if (!symbol) break;
          return send(res, 200, await market.getStockPrice(symbol), 60);
        case 'history': {
          if (!symbol) break;
          const range = q.get('range') || '1M';
          return send(res, 200, await market.getHistory(symbol, range), range === '1D' ? 60 : 600);
        }
      }
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      if (action === 'prices') {
        if (!Array.isArray(body.symbols)) return send(res, 400, { message: 'symbols array is required' });
        return send(res, 200, { results: await market.getPrices(body.symbols.slice(0, 100)) });
      }
      if (action === 'portfolio-history') {
        return send(res, 200, await market.getPortfolioHistory(body.holdings, body.range || '1M'));
      }
    }

    return send(res, 404, { message: 'Not found' });
  } catch (error) {
    return send(res, 502, { message: 'Market data is unavailable right now', error: error.message });
  }
}
