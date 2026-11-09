import { Link } from 'react-router-dom';
import { useFetch } from '../../lib/useFetch';
import { pct, ticker } from '../../lib/format';
import { cn } from '../ui';

// Scrolling tape: live indices followed by every tracked stock
export default function Ticker() {
  const idx = useFetch('/stocks/indices', { poll: 60000 });
  const mkt = useFetch('/stocks/market', { poll: 60000 });
  const items = [
    ...(idx.data?.indices || []).map((i) => ({ ...i, label: i.name, index: true })),
    ...(mkt.data?.stocks || []).map((s) => ({ ...s, label: ticker(s.symbol) })),
  ].filter((i) => i.price > 0);
  if (!items.length) return <div className="h-8 border-t border-neon-300/10 bg-ink-950/60" />;
  const row = items.length < 12 ? [...items, ...items, ...items] : items;
  return (
    <div className="relative h-8 overflow-hidden border-t border-neon-300/10 bg-ink-950/70">
      <div className="flex h-full w-max animate-marquee items-center hover:[animation-play-state:paused]" style={{ animationDuration: `${Math.max(60, row.length * 2.2)}s` }}>
        {[...row, ...row].map((i, idx) => {
          const up = i.change >= 0;
          return (
            <Link to={`/stock/${encodeURIComponent(i.symbol)}`} key={idx} className="flex items-center gap-2 px-4 text-[11px] text-ink-300 hover:bg-neon-300/[0.06]">
              <span className={cn('font-bold', i.index ? 'text-amber' : 'text-ink-100')}>{i.label}</span>
              <span className="num text-ink-50">{i.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              <span className={cn('num', up ? 'text-gain' : 'text-loss')}>
                {up ? '▲' : '▼'} {pct(i.changePercent)}
              </span>
              <span className="ml-2 text-ink-600">│</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
