import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Star, Wand2 } from 'lucide-react';
import { useFetch } from '../lib/useFetch';
import { api } from '../lib/api';
import { inr, num, pct, ticker } from '../lib/format';
import { useToast } from '../context/AppContext';
import { Button, Card, Change, Money, Segmented, Skeleton, StockAvatar, cn } from '../components/ui';
import { ValueChart } from '../components/charts';
import HoldingModal from '../components/modals/HoldingModal';

const RANGES = ['1D', '1W', '1M', '6M', '1Y', '5Y'];

export default function StockDetail() {
  const { symbol: raw } = useParams();
  const symbol = decodeURIComponent(raw);
  const isIndex = symbol.startsWith('^');
  const navigate = useNavigate();
  const toast = useToast();
  const [range, setRange] = useState('1M');
  const [buyOpen, setBuyOpen] = useState(false);
  const [whatIf, setWhatIf] = useState(10000);

  const quote = useFetch(`/stocks/quote/${encodeURIComponent(symbol)}`, { poll: 60000 });
  const hist = useFetch(`/stocks/history/${encodeURIComponent(symbol)}?range=${range}`);
  const portfolio = useFetch(isIndex ? null : '/portfolio?refresh=0');
  const watch = useFetch(isIndex ? null : '/watchlist?refresh=0');

  const q = quote.data;
  const points = useMemo(() => (hist.data?.points || []).map((p) => ({ t: p.t, v: p.c })), [hist.data]);
  const holding = portfolio.data?.holdings?.find((h) => h.symbol === symbol);
  const watchItem = watch.data?.items?.find((w) => w.symbol === symbol);
  const initialStock = useMemo(() => (q ? { symbol, name: q.name, exchange: q.exchange, sector: q.sector } : null), [symbol, q?.name, q?.exchange, q?.sector]); // eslint-disable-line react-hooks/exhaustive-deps

  const rangeChange = useMemo(() => {
    if (points.length < 2) return null;
    const base = range === '1D' ? hist.data?.previousClose ?? points[0].v : points[0].v;
    const last = points[points.length - 1].v;
    return { abs: last - base, pct: ((last - base) / base) * 100, base };
  }, [points, range, hist.data]);

  const toggleWatch = async () => {
    try {
      if (watchItem) {
        await api(`/watchlist/${watchItem._id}`, { method: 'DELETE' });
        toast(`${ticker(symbol)} removed from watchlist`, 'info');
      } else {
        await api('/watchlist', { method: 'POST', body: { symbol, companyName: q.name, exchange: q.exchange, currentPrice: q.price, priceChange: q.change, priceChangePercent: q.changePercent } });
        toast(`${ticker(symbol)} added to watchlist ⭐`);
      }
      watch.reload(true);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (quote.error)
    return (
      <Card className="py-16 text-center">
        <p className="text-ink-200">Couldn't load {ticker(symbol)}: {quote.error}</p>
        <Button variant="ghost" className="mt-6" onClick={() => navigate(-1)}>Go back</Button>
      </Card>
    );

  const lo = q?.fiftyTwoWeekLow;
  const hi = q?.fiftyTwoWeekHigh;
  const pos52 = q && lo && hi && hi > lo ? ((q.price - lo) / (hi - lo)) * 100 : null;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-300 hover:text-ink-50">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card raised className="!p-6 sm:!p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <StockAvatar symbol={symbol} size={52} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-ink-50 sm:text-3xl">{ticker(symbol)}</h1>
                  {q && <span className="rounded-lg bg-neon-300/[0.05] px-2 py-0.5 text-[11px] font-semibold text-ink-300">{isIndex ? 'Index' : `${q.exchange} · ${q.sector}`}</span>}
                </div>
                <p className="mt-0.5 text-sm text-ink-400">{q?.name || ' '}</p>
              </div>
            </div>
            {!isIndex && q && (
              <div className="flex gap-2">
                <Button variant="ghost" icon={Star} onClick={toggleWatch} className={watchItem ? '!text-neon-200' : ''}>
                  {watchItem ? 'Watching' : 'Watch'}
                </Button>
                <Button icon={Plus} onClick={() => setBuyOpen(true)}>{holding ? 'Buy more' : 'Add to portfolio'}</Button>
              </div>
            )}
          </div>

          <div className="mt-8">
            {q ? (
              <>
                <p className="num text-[40px] font-black leading-none text-ink-50 sm:text-[52px]">
                  {isIndex ? q.price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : inr(q.price)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {rangeChange && (
                    <span className={cn('num font-semibold', rangeChange.abs >= 0 ? 'text-gain' : 'text-loss')}>
                      {rangeChange.abs >= 0 ? '+' : '−'}
                      {Math.abs(rangeChange.abs).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({pct(rangeChange.pct)})
                    </span>
                  )}
                  <span className="text-ink-400">{range === '1D' ? 'today' : `past ${range}`}</span>
                </div>
              </>
            ) : (
              <Skeleton className="h-14 w-64" />
            )}
          </div>

          <div className="mt-6">{hist.loading && !hist.data ? <Skeleton className="h-[300px]" /> : <ValueChart points={points} range={range} height={300} money={!isIndex} baseline={range === '1D' ? hist.data?.previousClose : undefined} />}</div>
          <div className="mt-4 flex justify-center sm:justify-start">
            <Segmented options={RANGES} value={range} onChange={setRange} size="sm" />
          </div>
        </Card>

        <div className="space-y-6">
          {holding && q && (
            <Card className="border-neon-300/20 bg-gradient-to-br from-neon-300/[0.07] to-transparent">
              <p className="eyebrow mb-4">Your position</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-ink-400">Shares</p><p className="num mt-0.5 text-lg font-bold text-ink-50">{holding.quantity}</p></div>
                <div><p className="text-ink-400">Avg. price</p><p className="num mt-0.5 text-lg font-bold text-ink-50">{inr(holding.averagePrice)}</p></div>
                <div><p className="text-ink-400">Value</p><Money value={holding.quantity * (q?.price || holding.currentPrice)} className="mt-0.5 block text-lg font-bold text-ink-50" /></div>
                <div>
                  <p className="text-ink-400">Returns</p>
                  <Change value={(q?.price - holding.averagePrice) * holding.quantity} showIcon={false} className="mt-1" />
                  <p className="text-xs text-ink-400">{pct(((q?.price - holding.averagePrice) / holding.averagePrice) * 100)}</p>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <p className="eyebrow mb-4">Key stats</p>
            {q ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                {[
                  ['Open', q.open],
                  ['Prev. close', q.previousClose],
                  ['Day high', q.high],
                  ['Day low', q.low],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-ink-400">{k}</dt>
                    <dd className="num mt-0.5 font-semibold text-ink-50">{v?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</dd>
                  </div>
                ))}
                {!isIndex && (
                  <div>
                    <dt className="text-xs text-ink-400">Volume</dt>
                    <dd className="num mt-0.5 font-semibold text-ink-50">{num(q.volume)}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <Skeleton className="h-32" />
            )}
            {pos52 != null && (
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs text-ink-400">
                  <span>52W low</span>
                  <span>52W high</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-gradient-to-r from-loss/60 via-amber/60 to-gain/60">
                  <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink-900 bg-ink-50" style={{ left: `${pos52}%` }} />
                </div>
                <div className="num mt-2 flex justify-between text-xs font-semibold text-ink-200">
                  <span>{lo.toLocaleString('en-IN')}</span>
                  <span>{hi.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </Card>

          {!isIndex && rangeChange && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Wand2 size={16} className="text-neon-200" />
                <p className="eyebrow">What if?</p>
              </div>
              <p className="text-sm text-ink-300">
                If you had invested
                <span className="relative mx-1.5 inline-block">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-400">₹</span>
                  <input type="number" value={whatIf} onChange={(e) => setWhatIf(Number(e.target.value) || 0)} className="num w-28 rounded-xl border border-neon-300/20 bg-ink-950 py-1 pl-6 pr-2 font-semibold text-ink-50 outline-none focus:border-neon-300/50" aria-label="Amount invested" />
                </span>
                {range === '1D' ? 'yesterday' : `${range} ago`}, today it would be worth
              </p>
              <p className={cn('num mt-3 text-3xl font-black tracking-tight', rangeChange.pct >= 0 ? 'text-gain' : 'text-loss')}>{inr(whatIf * (1 + rangeChange.pct / 100), { decimals: 0 })}</p>
              <p className="mt-1 text-xs text-ink-400">Based on closing prices. Excludes dividends.</p>
            </Card>
          )}
        </div>
      </div>

      {!isIndex && q && (
        <HoldingModal open={buyOpen} onClose={() => setBuyOpen(false)} initialStock={initialStock} onSaved={() => portfolio.reload(true)} />
      )}
      {isIndex && (
        <p className="text-center text-xs text-ink-400">
          Indices can't be held directly. <Link to="/markets" className="text-neon-200">Browse stocks →</Link>
        </p>
      )}
    </div>
  );
}
