import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react';
import { useFetch } from '../../lib/useFetch';
import { ticker } from '../../lib/format';
import { StockAvatar, cn } from '../ui';
import { NAV } from './nav';

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef();
  const navigate = useNavigate();
  const { data } = useFetch(open ? '/stocks/list' : null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pages = [...NAV, { to: '/settings', label: 'Settings', icon: null }]
      .filter((n) => !s || n.label.toLowerCase().includes(s))
      .map((n) => ({ type: 'page', ...n }));
    const stocks = (data?.stocks || [])
      .filter((st) => s && (st.symbol.toLowerCase().includes(s) || st.name.toLowerCase().includes(s) || st.sector.toLowerCase().includes(s)))
      .slice(0, 8)
      .map((st) => ({ type: 'stock', to: `/stock/${encodeURIComponent(st.symbol)}`, ...st }));
    return s ? [...stocks, ...pages] : pages;
  }, [q, data]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);
  useEffect(() => {
    setActive(0);
  }, [q]);

  const go = (r) => {
    if (!r) return;
    navigate(r.to);
    onClose();
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') go(results[active]);
    else if (e.key === 'Escape') onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-neon-300/[0.12] bg-ink-850"
            role="dialog"
            aria-label="Search"
          >
            <div className="flex items-center gap-3 border-b border-neon-300/[0.12] px-5">
              <Search size={18} className="text-ink-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search 90+ stocks or jump to a page"
                className="h-14 flex-1 bg-transparent text-[15px] text-ink-50 outline-none placeholder:text-ink-400"
              />
              <kbd className="rounded-lg border border-neon-300/20 px-1.5 py-0.5 font-mono text-[10px] text-ink-400">ESC</kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-4 py-10 text-center text-sm text-ink-400">No matches for “{q}”</li>}
              {results.map((r, i) => (
                <li key={r.to}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn('flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left', i === active ? 'bg-neon-300/[0.05]' : '')}
                  >
                    {r.type === 'stock' ? (
                      <StockAvatar symbol={r.symbol} size={34} />
                    ) : (
                      <div className="grid h-[34px] w-[34px] place-items-center rounded-xl bg-ink-800 text-ink-300">
                        {r.icon ? <r.icon size={16} /> : <ArrowRight size={16} />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-50">{r.type === 'stock' ? ticker(r.symbol) : r.label}</p>
                      <p className="truncate text-xs text-ink-400">{r.type === 'stock' ? `${r.name} · ${r.sector}` : 'Go to page'}</p>
                    </div>
                    {i === active && <CornerDownLeft size={14} className="text-ink-400" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
