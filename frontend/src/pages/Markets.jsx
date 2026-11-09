import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star } from 'lucide-react';
import { useFetch } from '../lib/useFetch';
import { api } from '../lib/api';
import { pct, ticker } from '../lib/format';
import { useToast } from '../context/AppContext';
import { Card, Change, PageHeader, Segmented, Skeleton, Sparkline, StockAvatar, cn } from '../components/ui';

export default function Markets() {
  const toast = useToast();
  const market = useFetch('/stocks/market', { poll: 60000 });
  const indices = useFetch('/stocks/indices', { poll: 60000 });
  const watch = useFetch('/watchlist?refresh=0');
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('All');
  const [sort, setSort] = useState('change');
  const [busy, setBusy] = useState(null);

  const stocks = market.data?.stocks || [];
  const watched = useMemo(() => Object.fromEntries((watch.data?.items || []).map((w) => [w.symbol, w._id])), [watch.data]);
  const sectors = useMemo(() => ['All', ...[...new Set(stocks.map((s) => s.sector))].sort()], [stocks]);

  const sectorPerf = useMemo(() => {
    const m = {};
    stocks.forEach((s) => {
      m[s.sector] = m[s.sector] || { sum: 0, n: 0 };
      m[s.sector].sum += s.changePercent;
      m[s.sector].n++;
    });
    return Object.entries(m)
      .map(([name, { sum, n }]) => ({ name, avg: sum / n, n }))
      .sort((a, b) => b.avg - a.avg);
  }, [stocks]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const l = stocks.filter((s) => (sector === 'All' || s.sector === sector) && (!t || s.symbol.toLowerCase().includes(t) || s.name.toLowerCase().includes(t)));
    const sorters = {
      change: (a, b) => b.changePercent - a.changePercent,
      losers: (a, b) => a.changePercent - b.changePercent,
      price: (a, b) => b.price - a.price,
      name: (a, b) => a.symbol.localeCompare(b.symbol),
    };
    return [...l].sort(sorters[sort]);
  }, [stocks, q, sector, sort]);

  const toggleWatch = async (e, s) => {
    e.preventDefault();
    e.stopPropagation();
    setBusy(s.symbol);
    try {
      if (watched[s.symbol]) {
        await api(`/watchlist/${watched[s.symbol]}`, { method: 'DELETE' });
        toast(`${ticker(s.symbol)} removed from watchlist`, 'info');
      } else {
        await api('/watchlist', { method: 'POST', body: { symbol: s.symbol, companyName: s.name, exchange: s.exchange, currentPrice: s.price, priceChange: s.change, priceChangePercent: s.changePercent } });
        toast(`${ticker(s.symbol)} added to watchlist ⭐`);
      }
      await watch.reload(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Markets" title="What's" accent="moving" subtitle="Live quotes for 90+ Indian large caps. Tap the star to watch, tap a card for the full story." />

      {/* Indices */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(indices.data?.indices || Array(4).fill(null)).map((i, idx) =>
          i ? (
            <Link key={i.symbol} to={`/stock/${encodeURIComponent(i.symbol)}`}>
              <Card raised className="!p-5 transition hover:border-neon-300/20">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-300">{i.name}</p>
                  <Sparkline data={i.spark} width={60} height={22} positive={i.changePercent >= 0} />
                </div>
                <p className="num mt-3 text-xl font-bold text-ink-50 sm:text-2xl">{i.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <Change value={undefined} percent={i.changePercent} className="mt-1" />
              </Card>
            </Link>
          ) : (
            <Skeleton key={idx} className="h-[120px] rounded-3xl" />
          )
        )}
      </div>

      {/* Sector heatmap */}
      {sectorPerf.length > 0 && (
        <Card className="mb-8">
          <p className="eyebrow mb-4">Sector heatmap · today</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {sectorPerf.map((sp) => {
              const intensity = Math.min(Math.abs(sp.avg) / 3, 1);
              const bg = sp.avg >= 0 ? `rgba(61,220,151,${0.06 + intensity * 0.3})` : `rgba(255,107,107,${0.06 + intensity * 0.3})`;
              return (
                <button
                  key={sp.name}
                  onClick={() => setSector(sector === sp.name ? 'All' : sp.name)}
                  className={cn('rounded-2xl border px-3 py-3 text-left transition', sector === sp.name ? 'border-neon-300/50' : 'border-neon-300/[0.12] hover:border-neon-300/25')}
                  style={{ background: bg }}
                >
                  <p className="truncate text-[12px] font-semibold text-ink-50">{sp.name}</p>
                  <p className={cn('num text-sm font-bold', sp.avg >= 0 ? 'text-gain' : 'text-loss')}>{pct(sp.avg)}</p>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by company or symbol" className="field !py-2.5 pl-10" />
        </div>
        <Segmented
          size="sm"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'change', label: 'Top gainers' },
            { value: 'losers', label: 'Top losers' },
            { value: 'price', label: 'Price' },
            { value: 'name', label: 'A–Z' },
          ]}
        />
      </div>
      <div className="hide-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {sectors.map((x) => (
          <button
            key={x}
            onClick={() => setSector(x)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition',
              sector === x ? 'border-neon-300/40 bg-neon-300/10 text-neon-100' : 'border-neon-300/[0.12] text-ink-300 hover:text-ink-100'
            )}
          >
            {x}
          </button>
        ))}
      </div>

      {/* Grid */}
      {market.loading && !market.data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-3xl" />)}</div>
      ) : market.error ? (
        <Card className="py-14 text-center text-sm text-ink-300">Market data is unavailable right now: {market.error}</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s, i) => (
            <motion.div key={s.symbol} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.015, 0.3) }}>
              <Link to={`/stock/${encodeURIComponent(s.symbol)}`} className="surface group block p-5 transition hover:-translate-y-0.5 hover:border-neon-300/20 hover:">
                <div className="flex items-start gap-3">
                  <StockAvatar symbol={s.symbol} sector={s.sector} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink-50">{ticker(s.symbol)}</p>
                    <p className="truncate text-xs text-ink-400">{s.name}</p>
                  </div>
                  <button
                    onClick={(e) => toggleWatch(e, s)}
                    disabled={busy === s.symbol}
                    className={cn('rounded-xl p-2 transition', watched[s.symbol] ? 'text-neon-200' : 'text-ink-500 hover:bg-neon-300/[0.07] hover:text-ink-100')}
                    aria-label={watched[s.symbol] ? `Remove ${ticker(s.symbol)} from watchlist` : `Add ${ticker(s.symbol)} to watchlist`}
                  >
                    <Star size={17} fill={watched[s.symbol] ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="num text-lg font-bold text-ink-50">₹{s.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    <Change percent={s.changePercent} />
                  </div>
                  <Sparkline data={s.spark} width={110} height={36} positive={s.changePercent >= 0} />
                </div>
              </Link>
            </motion.div>
          ))}
          {!list.length && <p className="col-span-full py-14 text-center text-sm text-ink-400">No stocks match your search.</p>}
        </div>
      )}
    </div>
  );
}
