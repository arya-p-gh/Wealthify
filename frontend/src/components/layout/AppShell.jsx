import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Search, Eye, EyeOff, Home, Command } from 'lucide-react';
import { useAuth, usePrefs } from '../../context/AppContext';
import { cn } from '../ui';
import { marketStatus } from '../../lib/format';
import { useFetch } from '../../lib/useFetch';
import Ticker from './Ticker';
import CommandPalette from './CommandPalette';
import Logo from './Logo';
import { NAV } from './nav';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const istTime = (d) => d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });

// Bloomberg-style status line pinned to the bottom of the screen (desktop)
function StatusBar({ user }) {
  const now = useClock();
  const status = marketStatus();
  const { data, error } = useFetch('/stocks/market', { poll: 60000 });
  const b = data?.breadth;
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 hidden h-7 items-center gap-5 border-t border-neon-300/15 bg-ink-950/95 px-4 text-[10.5px] uppercase tracking-[0.12em] text-ink-400 lg:flex">
      <span className="flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5', status.open ? 'animate-blink bg-gain shadow-[0_0_8px_#2bf08a]' : 'bg-ink-400')} />
        <span className={status.open ? 'text-gain' : ''}>NSE/BSE {status.open ? 'OPEN' : 'CLOSED'}</span>
      </span>
      <span>IST <span className="num text-ink-100">{istTime(now)}</span></span>
      {b && (
        <span>
          ADV <span className="num text-gain">{b.advances}</span> · DEC <span className="num text-loss">{b.declines}</span> · UNCH <span className="num text-ink-200">{b.unchanged}</span>
        </span>
      )}
      <span>FEED <span className={error ? 'text-loss' : 'text-gain'}>{error ? 'ERR' : 'LIVE'}</span> · YAHOO · 60s</span>
      <span className="ml-auto">
        <span className="text-neon-400">demo</span>@wealthify:~$ <span className="normal-case text-ink-500">data saved in this browser</span>
      </span>
      <span className="hidden xl:inline">⌥1–6 NAV · ⌘K SEARCH</span>
    </footer>
  );
}

export default function AppShell() {
  const { user } = useAuth();
  const { hideBalances, setPref } = usePrefs();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const now = useClock();
  const status = marketStatus();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      // Alt/Option + 1..6 jumps between screens, terminal style
      if (e.altKey && /^Digit[1-9]$/.test(e.code)) {
        const item = NAV[Number(e.code.slice(5)) - 1];
        if (item) {
          e.preventDefault();
          navigate(item.to);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-neon-300/15 bg-ink-950/90 pb-7 lg:flex">
        <div className="flex h-16 items-center border-b border-neon-300/10 px-5">
          <Logo />
        </div>
        <p className="px-5 pb-2 pt-6 text-[10px] uppercase tracking-[0.22em] text-ink-500">── Navigation</p>
        <nav className="flex flex-1 flex-col gap-px px-3">
          {NAV.map(({ to, label, icon: Icon }, i) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-colors',
                  isActive ? 'text-ink-950' : 'text-ink-300 hover:bg-neon-300/[0.05] hover:text-neon-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-sm bg-neon-300 shadow-[0_0_20px_-4px_rgba(57,255,149,0.8)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className={cn('relative w-4 text-[10px]', isActive ? 'text-ink-900' : 'text-ink-500')}>{i + 1}</span>
                  <Icon size={16} className="relative" strokeWidth={2} />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-3 border border-neon-300/15 bg-ink-900 p-3 text-[11px]">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold uppercase tracking-[0.1em]">
              <span className={cn('h-1.5 w-1.5', status.open ? 'animate-blink bg-gain shadow-[0_0_8px_#2bf08a]' : 'bg-ink-400')} />
              <span className={status.open ? 'text-gain' : 'text-ink-300'}>{status.label}</span>
            </span>
            <span className="num text-ink-100">{istTime(now)}</span>
          </div>
          <p className="leading-relaxed text-ink-400">NSE/BSE 09:15–15:30 IST · Mon–Fri</p>
        </div>

        <div className="mx-3 mt-3 flex items-center gap-2 border border-neon-300/10 px-2 py-2">
          <NavLink to="/settings" className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-90">
            <div className="grid h-8 w-8 shrink-0 place-items-center border border-neon-300/40 bg-neon-300/10 text-[11px] font-bold text-neon-200">
              {(user?.name || 'W').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-ink-50">{user?.name}</p>
              <p className="truncate text-[10.5px] text-ink-400">demo · saved locally</p>
            </div>
          </NavLink>
          <button
            onClick={() => navigate('/')}
            className="rounded-sm p-2 text-ink-400 hover:bg-neon-300/[0.06] hover:text-neon-200"
            aria-label="Back to home page"
            title="Back to home page"
          >
            <Home size={15} />
          </button>
        </div>
      </aside>

      <div className="relative lg:pl-[236px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-neon-300/15 bg-ink-950/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Logo className="lg:hidden" compact />
            <button
              onClick={() => setPaletteOpen(true)}
              className="ml-auto flex h-9 items-center gap-3 rounded-sm border border-neon-300/15 bg-ink-900 px-3 text-[12px] text-ink-400 transition hover:border-neon-300/40 hover:text-ink-200 lg:ml-0 lg:w-[380px]"
            >
              <Search size={14} className="text-neon-400" />
              <span className="hidden sm:inline">
                <span className="text-neon-400">&gt;</span> search symbol or command…
              </span>
              <kbd className="ml-auto hidden items-center gap-0.5 border border-neon-300/20 px-1.5 py-0.5 text-[10px] text-ink-300 lg:flex">
                <Command size={10} />K
              </kbd>
            </button>
            <div className="flex items-center gap-1 lg:ml-auto">
              <button
                onClick={() => setPref('hideBalances', !hideBalances)}
                className="grid h-9 w-9 place-items-center rounded-sm text-ink-300 transition hover:bg-neon-300/[0.06] hover:text-neon-200"
                aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
                title={hideBalances ? 'Show balances' : 'Hide balances'}
              >
                {hideBalances ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn('grid h-9 w-9 place-items-center rounded-sm transition hover:bg-neon-300/[0.06]', isActive ? 'text-neon-200' : 'text-ink-300 hover:text-neon-200')
                }
                aria-label="Settings"
              >
                <Settings size={17} />
              </NavLink>
            </div>
          </div>
          <Ticker />
        </header>

        <main className="relative mx-auto max-w-[1400px] px-4 pb-32 pt-8 sm:px-6 lg:px-8 lg:pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <StatusBar user={user} />

      {/* Bottom nav (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex justify-between border-t border-neon-300/20 bg-ink-950/95 px-1 pt-1.5 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
      >
        {NAV.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('flex flex-1 flex-col items-center gap-1 rounded-sm py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]', isActive ? 'bg-neon-300/10 text-neon-200' : 'text-ink-400')
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
