import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Play, SquareTerminal } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { Button } from '../components/ui';
import { IndexBoard, MoversTable, TermWindow, useMarket } from '../components/market/LiveMarket';
import { marketStatus } from '../lib/format';
import { useAuth } from '../context/AppContext';

const FEATURES = [
  ['wealth-score', 'A 300–900 health score for your portfolio: diversification, concentration, returns and goal progress.'],
  ['live-markets', 'NIFTY, SENSEX, BANK and IT indices plus 90+ large caps, refreshed every 60 seconds.'],
  ['portfolio-xray', 'Sector allocation, concentration risk, day P&L and overall returns on one screen.'],
  ['goals', 'Name a target and a date; get the monthly SIP you need and see if you are on pace.'],
  ['price-alerts', 'Breakout and buy-the-dip levels on your watchlist, flagged the moment they trigger.'],
  ['calculators', 'SIP, step-up SIP, lumpsum and EMI with year-by-year projections.'],
];

const BOOT = ['initialising wealthify terminal v2.0', 'connecting to market feed ........ ok', 'loading NSE/BSE universe ......... ok', 'ready.'];

function useIstClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
}

function Stat({ k, v, tone }) {
  return (
    <div className="px-4 py-6 text-center sm:py-8">
      <p className={`num text-2xl font-bold sm:text-3xl ${tone || 'text-ink-50'}`}>{k ?? '—'}</p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ink-400">{v}</p>
    </div>
  );
}

// Primary actions: no sign-up — the demo runs entirely in this browser.
function DemoButtons({ size = 'lg', center }) {
  const { user, startDemo } = useAuth();
  const navigate = useNavigate();
  const go = (mode) => {
    if (mode) startDemo(mode);
    navigate('/dashboard');
  };
  return (
    <div className={`flex flex-wrap items-center gap-3 ${center ? 'justify-center' : ''}`}>
      {user ? (
        <>
          <Button size={size} icon={SquareTerminal} onClick={() => go(null)}>Resume demo</Button>
          <Button size={size} variant="ghost" icon={Play} onClick={() => go('sample')}>Restart with sample data</Button>
        </>
      ) : (
        <>
          <Button size={size} icon={Play} onClick={() => go('sample')}>Try the demo</Button>
          <Button size={size} variant="ghost" onClick={() => go('empty')}>Start with an empty portfolio</Button>
        </>
      )}
    </div>
  );
}

export default function Landing() {
  const clock = useIstClock();
  const { user, startDemo } = useAuth();
  const navigate = useNavigate();
  const status = marketStatus();
  const market = useMarket();
  const m = market.data;
  const b = m?.breadth;

  return (
    <div className="min-h-screen overflow-hidden text-ink-100">
      <header className="relative z-10 border-b border-neon-300/15 bg-ink-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Logo to="/" />
          <span className="hidden text-[11px] uppercase tracking-[0.16em] text-ink-400 md:inline">
            IST <span className="num text-ink-100">{clock}</span> · NSE <span className={status.open ? 'text-gain' : 'text-ink-300'}>{status.open ? 'OPEN' : 'CLOSED'}</span>
          </span>
          <Button
            variant="light"
            size="sm"
            icon={ArrowUpRight}
            onClick={() => {
              if (!user) startDemo('sample');
              navigate('/dashboard');
            }}
          >
            {user ? 'Resume demo' : 'Try demo'}
          </Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl items-start gap-12 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1fr_1fr] lg:pt-20">
        <div>
          <div className="mb-8 space-y-1 text-[12px] text-ink-400">
            {BOOT.map((line, i) => (
              <motion.p key={line} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.25 }}>
                <span className="text-neon-400">[{String(i).padStart(2, '0')}]</span> {line}
              </motion.p>
            ))}
          </div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="font-display text-[64px] leading-[0.9] text-ink-50 sm:text-[92px]"
          >
            <span className="text-neon">&gt;</span> track.
            <br />
            <span className="text-neon">&gt;</span> analyse.
            <br />
            <span className="text-neon">&gt;</span> <span className="text-neon">compound</span>
            <span className="cursor" />
          </motion.h1>
          <p className="mt-7 max-w-md text-[14px] leading-relaxed text-ink-300">
            A market terminal for your own money. Live Indian markets, your holdings marked to market every minute, and a clear read on whether you're on track.
          </p>
          <div className="mt-9">
            <DemoButtons />
          </div>
          <p className="mt-8 text-[11px] text-ink-500">No sign-up · Your demo data is saved only in this browser · Market data is live</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <IndexBoard />
        </motion.div>
      </section>

      {/* Live market breadth — real numbers from the tracked universe */}
      <section className="relative z-10 border-y border-neon-300/15 bg-ink-950/70">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-neon-300/10 px-5 sm:px-8 md:grid-cols-4">
          <Stat k={m?.stocks?.length} v="Stocks tracked live" />
          <Stat k={b?.advances} v="Advancing today" tone="text-gain" />
          <Stat k={b?.declines} v="Declining today" tone="text-loss" />
          <Stat k={b ? `${((b.advances / Math.max(b.declines, 1)) || 0).toFixed(2)}` : null} v="Adv / Dec ratio" tone="text-amber" />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Market snapshot</p>
            <h2 className="text-2xl font-bold text-ink-50 sm:text-3xl">
              <span className="text-neon">$</span> top movers --today
            </h2>
          </div>
          <p className="text-[11px] text-ink-500">updates every 60s</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <MoversTable title="gainers.tsv" rows={m?.gainers} loading={market.loading} />
          <MoversTable title="losers.tsv" rows={m?.losers} loading={market.loading} />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <TermWindow title="~/wealthify — zsh">
          <div className="p-5 text-[13px] sm:p-7">
            <p className="text-ink-300">
              <span className="text-neon-400">guest@wealthify</span>:<span className="text-violet">~</span>$ ls -l ./features
            </p>
            <div className="mt-4 space-y-3">
              {FEATURES.map(([name, body], i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="grid gap-1 sm:grid-cols-[200px_1fr] sm:gap-6"
                >
                  <span className="font-bold text-neon-200">-rwx {name}</span>
                  <span className="text-ink-300">{body}</span>
                </motion.div>
              ))}
            </div>
            <p className="mt-6 text-ink-300">
              <span className="text-neon-400">guest@wealthify</span>:<span className="text-violet">~</span>$ <span className="cursor" />
            </p>
          </div>
        </TermWindow>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="surface px-6 py-14 text-center sm:py-20">
          <h2 className="font-display text-5xl text-ink-50 sm:text-7xl">
            <span className="text-neon">./start</span> --now
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[13px] text-ink-300">
            Jump into a sample portfolio marked to the live market, or start empty and add your own holdings. Everything you change stays in this browser.
          </p>
          <div className="mt-9">
            <DemoButtons center />
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-neon-300/15 bg-ink-950/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-[11px] text-ink-400 sm:flex-row sm:px-8">
          <Logo to="/" />
          <p>Market data via Yahoo Finance, may be delayed. Not investment advice.</p>
          <p>© {new Date().getFullYear()} Wealthify</p>
        </div>
      </footer>
    </div>
  );
}
