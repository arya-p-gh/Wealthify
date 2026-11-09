import { Link } from 'react-router-dom';
import { useFetch } from '../../lib/useFetch';
import { marketStatus, pct, ticker } from '../../lib/format';
import { ValueChart } from '../charts';
import { Skeleton, cn } from '../ui';

const fmt = (v) => (Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

// Terminal window chrome
export function TermWindow({ title, right, children, className }) {
  return (
    <div className={cn('surface overflow-hidden !p-0', className)}>
      <div className="flex items-center gap-1.5 border-b border-neon-300/15 bg-ink-950/80 px-3 py-2">
        <span className="h-2 w-2 bg-loss/70" />
        <span className="h-2 w-2 bg-amber/70" />
        <span className="h-2 w-2 bg-gain/70" />
        <span className="ml-2 truncate text-[10px] uppercase tracking-[0.2em] text-ink-400">{title}</span>
        {right && <span className="ml-auto text-[10px] uppercase tracking-[0.16em]">{right}</span>}
      </div>
      {children}
    </div>
  );
}

export function LiveBadge() {
  const s = marketStatus();
  return (
    <span className={cn('flex items-center gap-1.5', s.open ? 'text-gain' : 'text-ink-400')}>
      <span className={cn('h-1.5 w-1.5', s.open ? 'animate-blink bg-gain' : 'bg-ink-400')} />
      {s.open ? 'live' : 'closed · last session'}
    </span>
  );
}

// Live indices + NIFTY 50 intraday chart — real data from the public market endpoints
export function IndexBoard({ chartHeight = 170 }) {
  const idx = useFetch('/stocks/indices', { poll: 60000 });
  const hist = useFetch('/stocks/history/%5ENSEI?range=1D', { poll: 120000 });
  const indices = idx.data?.indices || [];
  const nifty = indices.find((i) => i.symbol === '^NSEI');
  const points = (hist.data?.points || []).map((p) => ({ t: p.t, v: p.c })).filter((p) => p.v);

  return (
    <TermWindow title="wealthify://market/indices" right={<LiveBadge />}>
      <div className="p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400">NIFTY 50 · intraday</p>
            {nifty ? (
              <p className="num mt-1 text-3xl font-bold text-ink-50 sm:text-4xl">{fmt(nifty.price)}</p>
            ) : (
              <Skeleton className="mt-1 h-9 w-44" />
            )}
          </div>
          {nifty && (
            <p className={cn('num text-sm font-bold', nifty.change >= 0 ? 'text-gain' : 'text-loss')}>
              {nifty.change >= 0 ? '▲' : '▼'} {fmt(Math.abs(nifty.change))} ({pct(nifty.changePercent)})
            </p>
          )}
        </div>
        <div className="mt-3">
          {points.length > 1 ? (
            <ValueChart points={points} range="1D" height={chartHeight} baseline={hist.data?.previousClose} money={false} />
          ) : (
            <Skeleton style={{ height: chartHeight }} className="w-full" />
          )}
        </div>
      </div>
      <table className="w-full border-t border-neon-300/10 text-[12px]">
        <tbody>
          {(indices.length ? indices : Array.from({ length: 4 }, () => null)).map((i, k) =>
            i ? (
              <tr key={i.symbol} className="border-b border-neon-300/[0.06] last:border-0 hover:bg-neon-300/[0.04]">
                <td className="px-4 py-2 font-bold text-amber sm:px-5">{i.name}</td>
                <td className="num px-2 py-2 text-right text-ink-50">{fmt(i.price)}</td>
                <td className={cn('num px-4 py-2 text-right sm:px-5', i.change >= 0 ? 'text-gain' : 'text-loss')}>
                  {i.change >= 0 ? '▲' : '▼'} {pct(i.changePercent)}
                </td>
              </tr>
            ) : (
              <tr key={k}>
                <td colSpan={3} className="px-4 py-2">
                  <Skeleton className="h-4 w-full" />
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </TermWindow>
  );
}

// Breadth + top movers across the full tracked universe
export function useMarket() {
  return useFetch('/stocks/market', { poll: 60000 });
}

export function MoversTable({ title, rows = [], loading, linkable }) {
  return (
    <TermWindow title={title}>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-neon-300/10 text-[10px] uppercase tracking-[0.16em] text-ink-400">
            <th className="px-4 py-2 text-left font-medium">Symbol</th>
            <th className="px-2 py-2 text-right font-medium">LTP</th>
            <th className="px-4 py-2 text-right font-medium">Chg%</th>
          </tr>
        </thead>
        <tbody>
          {loading && !rows.length
            ? Array.from({ length: 5 }, (_, k) => (
                <tr key={k}>
                  <td colSpan={3} className="px-4 py-2">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            : rows.map((s) => {
                const name = (
                  <>
                    <span className="font-bold text-ink-50">{ticker(s.symbol)}</span>
                    <span className="ml-2 hidden text-ink-400 sm:inline">{s.sector}</span>
                  </>
                );
                return (
                  <tr key={s.symbol} className="border-b border-neon-300/[0.06] last:border-0 hover:bg-neon-300/[0.04]">
                    <td className="px-4 py-2">{linkable ? <Link to={`/stock/${encodeURIComponent(s.symbol)}`}>{name}</Link> : name}</td>
                    <td className="num px-2 py-2 text-right text-ink-100">{fmt(s.price)}</td>
                    <td className={cn('num px-4 py-2 text-right font-semibold', s.changePercent >= 0 ? 'text-gain' : 'text-loss')}>{pct(s.changePercent)}</td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </TermWindow>
  );
}
