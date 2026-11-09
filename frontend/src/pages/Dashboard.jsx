import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, BellRing, ChevronRight, Lightbulb, Plus, RefreshCw, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AppContext';
import { useFetch } from '../lib/useFetch';
import { greeting, ticker } from '../lib/format';
import { insights, summarize, wealthScore } from '../lib/analytics';
import { AnimatedMoney, Button, Card, Change, Empty, Money, SectionTitle, Segmented, Skeleton, Sparkline, StockAvatar, cn } from '../components/ui';
import { AllocationDonut, ScoreGauge, ValueChart } from '../components/charts';
import HoldingModal from '../components/modals/HoldingModal';

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
});

export default function Dashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState('1M');
  const [addOpen, setAddOpen] = useState(false);
  const portfolio = useFetch('/portfolio', { poll: 60000 });
  const history = useFetch(`/portfolio/history?range=${range}`);
  const watch = useFetch('/watchlist?refresh=1', { poll: 60000 });
  const goals = useFetch('/goals');
  const market = useFetch('/stocks/market', { poll: 120000 });

  const holdings = portfolio.data?.holdings || [];
  const s = useMemo(() => summarize(holdings), [holdings]);
  const goalList = goals.data?.goals || [];
  const score = useMemo(() => wealthScore(s, goalList), [s, goalList]);
  const tips = useMemo(() => insights(s, goalList), [s, goalList]);
  const watchItems = watch.data?.items || [];
  const triggered = watchItems.filter((w) => w.alertTriggered);
  const points = (history.data?.points || []).map((p) => ({ t: p.t, v: p.v }));
  const loading = portfolio.loading && !portfolio.data;
  const reloadAll = () => {
    portfolio.reload();
    history.reload();
  };

  return (
    <div className="space-y-6">
      <motion.div {...fade()} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-[26px] font-extrabold leading-[1.15] text-ink-50 sm:text-[34px]">
            <span className="text-neon">$</span> {greeting().toLowerCase()}, <span className="text-neon">{user?.name?.split(' ')[0]?.toLowerCase()}</span>
            <span className="cursor" />
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" icon={RefreshCw} onClick={reloadAll} aria-label="Refresh prices">
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button icon={Plus} onClick={() => setAddOpen(true)}>
            Add holding
          </Button>
        </div>
      </motion.div>

      {triggered.length > 0 && (
        <motion.div {...fade(1)}>
          <Link to="/watchlist" className="flex items-center gap-3 rounded-3xl border border-neon-300/25 bg-neon-300/[0.06] px-5 py-4 transition hover:bg-neon-300/10">
            <BellRing size={18} className="text-neon-200" />
            <p className="flex-1 text-sm text-ink-100">
              <span className="font-bold">{triggered.length} price alert{triggered.length > 1 ? 's' : ''} triggered:</span>{' '}
              {triggered.map((t) => ticker(t.symbol)).join(', ')}
            </p>
            <ChevronRight size={16} className="text-ink-300" />
          </Link>
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Net worth hero */}
        <motion.section {...fade(1)} className="relative overflow-hidden rounded-sm border border-neon-300/[0.12] bg-gradient-to-br from-ink-750 via-ink-850 to-ink-900 p-6 grain sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_0%_0%,rgba(57,255,149,0.13),transparent_60%)]" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow mb-3">Portfolio value</p>
              {loading ? (
                <Skeleton className="h-14 w-72" />
              ) : (
                <AnimatedMoney value={s.current} className="text-[42px] font-black leading-none text-ink-50 sm:text-[48px]" />
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-ink-400">Today</span>
                  <Change value={s.dayChange} percent={s.dayChangePct} pill />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ink-400">Overall</span>
                  <Change value={s.pnl} percent={s.pnlPct} pill />
                </div>
              </div>
            </div>
            <Segmented options={['1D', '1W', '1M', '6M', '1Y']} value={range} onChange={setRange} size="sm" />
          </div>
          <div className="relative mt-6">
            {history.loading && !history.data ? (
              <Skeleton className="h-[260px] w-full" />
            ) : holdings.length ? (
              <ValueChart points={points} range={range} />
            ) : (
              <Empty
                icon={Sparkles}
                title="Your wealth story starts here"
                body="Add your first holding to unlock live tracking, your Wealth Score and personalised insights."
                action={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add first holding</Button>}
              />
            )}
          </div>
          <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-neon-300/[0.12] pt-6">
            {[
              ['Invested', s.invested],
              ['Current', s.current],
              ['Returns', s.pnl],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-ink-400">{k}</p>
                <Money value={v} compact sign={k === 'Returns'} className={cn('mt-1 block text-lg font-bold', k === 'Returns' ? (v >= 0 ? 'text-gain' : 'text-loss') : 'text-ink-50')} />
              </div>
            ))}
          </div>
        </motion.section>

        {/* Wealth score */}
        <motion.section {...fade(2)} className="surface-raised flex flex-col p-6 sm:p-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow mb-1">Wealth score</p>
              <p className="text-sm text-ink-300">How healthy is your money?</p>
            </div>
            <span className="rounded-full border border-neon-300/20 px-2.5 py-1 text-[10px] font-semibold text-ink-300">300 – 900</span>
          </div>
          <div className="my-6 flex justify-center">
            {loading ? <Skeleton className="h-[140px] w-[220px]" /> : <ScoreGauge score={score.score} band={score.band} />}
          </div>
          <div className="space-y-3.5">
            {score.factors.map((f) => (
              <div key={f.key}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-ink-100">{f.key}</span>
                  <span className="num text-ink-400">{Math.round(f.value * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <motion.div
                    className={cn('h-full rounded-full', f.value > 0.7 ? 'bg-gain' : f.value > 0.4 ? 'bg-amber' : 'bg-loss')}
                    initial={{ width: 0 }}
                    animate={{ width: `${f.value * 100}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-400">{f.hint}</p>
              </div>
            ))}
            {!score.factors.length && <p className="text-center text-sm text-ink-400">Add holdings to calculate your score.</p>}
          </div>
        </motion.section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Allocation */}
        <motion.div {...fade(3)}>
          <Card className="h-full">
            <SectionTitle eyebrow="Allocation" title="By sector" />
            {s.sectors.length ? (
              <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
                <AllocationDonut
                  data={s.sectors}
                  size={160}
                  center={
                    <div>
                      <p className="text-2xl font-black text-ink-50">{s.sectors.length}</p>
                      <p className="text-[10px] uppercase tracking-widest text-ink-400">sectors</p>
                    </div>
                  }
                />
                <ul className="w-full flex-1 space-y-2">
                  {s.sectors.slice(0, 6).map((sec) => (
                    <li key={sec.name} className="flex items-center gap-2.5 text-[13px]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: sec.color }} />
                      <span className="flex-1 truncate text-ink-200">{sec.name}</span>
                      <span className="num font-semibold text-ink-50">{sec.weight.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-ink-400">Nothing to allocate yet.</p>
            )}
          </Card>
        </motion.div>

        {/* Insights */}
        <motion.div {...fade(4)}>
          <Card className="h-full">
            <SectionTitle eyebrow="Smart insights" title="What we noticed" />
            {tips.length ? (
              <ul className="space-y-3">
                {tips.map((t, i) => {
                  const Icon = t.tone === 'warn' ? AlertTriangle : t.tone === 'loss' ? TrendingDown : t.tone === 'gain' ? TrendingUp : Lightbulb;
                  const color = t.tone === 'warn' ? 'text-amber' : t.tone === 'loss' ? 'text-loss' : t.tone === 'gain' ? 'text-gain' : 'text-violet';
                  return (
                    <li key={i} className={cn("flex gap-3 rounded-sm border-l-2 border-current bg-neon-300/[0.03] p-3.5", color)}>
                      <Icon size={17} className={cn('mt-0.5 shrink-0', color)} />
                      <div>
                        <p className="text-[13px] font-semibold text-ink-50">{t.title}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-400">{t.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-10 text-center text-sm text-ink-400">Insights appear once you add holdings.</p>
            )}
          </Card>
        </motion.div>

        {/* Movers */}
        <motion.div {...fade(5)}>
          <Card className="h-full">
            <SectionTitle eyebrow="Market pulse" title="Top movers today" action={<Link to="/markets" className="text-xs font-semibold text-neon-200 hover:text-neon-100">See all</Link>} />
            {market.loading && !market.data ? (
              <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11" />)}</div>
            ) : (
              <>
                {market.data?.breadth && (
                  <div className="mb-4">
                    <div className="flex h-2 overflow-hidden rounded-full">
                      <div className="bg-gain" style={{ flex: market.data.breadth.advances }} />
                      <div className="bg-ink-500" style={{ flex: market.data.breadth.unchanged }} />
                      <div className="bg-loss" style={{ flex: market.data.breadth.declines }} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] font-semibold">
                      <span className="text-gain">{market.data.breadth.advances} advancing</span>
                      <span className="text-loss">{market.data.breadth.declines} declining</span>
                    </div>
                  </div>
                )}
                <ul className="space-y-1">
                  {[...(market.data?.gainers || []).slice(0, 3), ...(market.data?.losers || []).slice(0, 2)].map((m) => (
                    <li key={m.symbol}>
                      <Link to={`/stock/${encodeURIComponent(m.symbol)}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-neon-300/[0.05]">
                        <StockAvatar symbol={m.symbol} size={34} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-ink-50">{ticker(m.symbol)}</p>
                          <p className="truncate text-[11px] text-ink-400">{m.sector}</p>
                        </div>
                        <Change percent={m.changePercent} pill />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Holdings preview */}
        <motion.div {...fade(6)}>
          <Card>
            <SectionTitle
              eyebrow="Holdings"
              title={`${holdings.length} stock${holdings.length === 1 ? '' : 's'}`}
              action={
                <Link to="/portfolio" className="flex items-center gap-1 text-xs font-semibold text-neon-200 hover:text-neon-100">
                  Manage <ArrowUpRight size={13} />
                </Link>
              }
            />
            {loading ? (
              <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : holdings.length ? (
              <ul className="divide-y divide-neon-300/[0.12]">
                {[...s.rows].sort((a, b) => b.value - a.value).slice(0, 5).map((h) => (
                  <li key={h._id}>
                    <Link to={`/stock/${encodeURIComponent(h.symbol)}`} className="flex items-center gap-3 py-3 transition hover:opacity-90">
                      <StockAvatar symbol={h.symbol} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-50">{ticker(h.symbol)}</p>
                        <p className="text-xs text-ink-400">{h.quantity} shares · {h.weight.toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <Money value={h.value} className="block font-semibold text-ink-50" />
                        <Change percent={h.pnlPct} showIcon={false} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-ink-400">No holdings yet.</p>
            )}
          </Card>
        </motion.div>

        {/* Watchlist preview */}
        <motion.div {...fade(7)}>
          <Card>
            <SectionTitle
              eyebrow="Watchlist"
              title="On your radar"
              action={
                <Link to="/watchlist" className="flex items-center gap-1 text-xs font-semibold text-neon-200 hover:text-neon-100">
                  Open <ArrowUpRight size={13} />
                </Link>
              }
            />
            {watchItems.length ? (
              <ul className="space-y-1">
                {watchItems.slice(0, 5).map((w) => (
                  <li key={w._id}>
                    <Link to={`/stock/${encodeURIComponent(w.symbol)}`} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-neon-300/[0.05]">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-50">
                          {ticker(w.symbol)} {w.alertTriggered && <BellRing size={12} className="text-neon-200" />}
                        </p>
                        <p className="truncate text-[11px] text-ink-400">{w.companyName}</p>
                      </div>
                      <Sparkline data={w.spark} width={70} height={26} positive={w.priceChangePercent >= 0} />
                      <div className="w-24 text-right">
                        <p className="num text-[13px] font-semibold text-ink-50">₹{w.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        <Change percent={w.priceChangePercent} showIcon={false} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="Nothing on your radar" body="Star stocks from Markets to track them here." action={<Link to="/markets"><Button variant="ghost" size="sm">Browse markets</Button></Link>} className="py-8" />
            )}
          </Card>
        </motion.div>
      </div>

      <HoldingModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={reloadAll} />
    </div>
  );
}
