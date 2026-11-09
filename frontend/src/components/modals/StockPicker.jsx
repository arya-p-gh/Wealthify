import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../lib/api';
import { ticker } from '../../lib/format';
import { StockAvatar, useDebounced, cn } from '../ui';

// Search-as-you-type stock picker
export default function StockPicker({ onPick, autoFocus = true }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const dq = useDebounced(q, 180);

  useEffect(() => {
    if (!dq) return setResults([]);
    let alive = true;
    api(`/stocks/search?q=${encodeURIComponent(dq)}`)
      .then((d) => alive && setResults(d.stocks))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [dq]);

  return (
    <div>
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, symbol or sector — e.g. Infosys, HDFC, Pharma"
          className="field pl-11"
        />
      </div>
      <ul className={cn('mt-3 space-y-1', !results.length && 'hidden')}>
        {results.map((s) => (
          <li key={s.symbol}>
            <button
              onClick={() => onPick(s)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-neon-300/[0.05]"
            >
              <StockAvatar symbol={s.symbol} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-50">{ticker(s.symbol)}</p>
                <p className="truncate text-xs text-ink-400">{s.name}</p>
              </div>
              <span className="rounded-lg bg-neon-300/[0.05] px-2 py-1 text-[11px] font-medium text-ink-300">{s.sector}</span>
            </button>
          </li>
        ))}
      </ul>
      {dq && !results.length && <p className="mt-6 text-center text-sm text-ink-400">No stocks match “{dq}”</p>}
    </div>
  );
}
