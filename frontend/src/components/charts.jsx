import { useId } from 'react';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { usePrefs } from '../context/AppContext';
import { compact, inr, pct } from '../lib/format';
import { cn } from './ui';

const fmtTime = (t, range) => {
  const d = new Date(t);
  if (range === '1D') return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (range === '1W') return d.toLocaleDateString('en-IN', { weekday: 'short', hour: '2-digit' });
  if (range === '5Y') return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Area chart for price / portfolio value series. points: [{t, v}]
export function ValueChart({ points = [], range = '1M', height = 260, baseline, money = true }) {
  const gid = useId().replace(/:/g, '');
  const { hideBalances } = usePrefs();
  if (points.length < 2) return <div style={{ height }} className="grid place-items-center text-sm text-ink-400">Not enough data for this range yet</div>;
  const first = baseline ?? points[0].v;
  const up = points[points.length - 1].v >= first;
  const color = up ? '#2bf08a' : '#ff4d6a';
  const min = Math.min(...points.map((p) => p.v));
  const max = Math.max(...points.map((p) => p.v));
  const pad = (max - min) * 0.12 || max * 0.01;

  return (
    <div style={{ height }} className="-mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(57,255,149,0.07)" strokeDasharray="2 4" />
          <XAxis dataKey="t" hide />
          <YAxis
            domain={[min - pad, max + pad]}
            orientation="right"
            width={hideBalances && money ? 0 : 64}
            hide={hideBalances && money}
            tick={{ fill: '#4a6b55', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            tickCount={5}
            tickFormatter={(v) => (money ? compact(v) : v.toLocaleString('en-IN', { maximumFractionDigits: 0 }))}
          />
          {baseline != null && <ReferenceLine y={baseline} stroke="#4a6b55" strokeDasharray="3 4" />}
          <Tooltip
            cursor={{ stroke: '#4a6b55', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              const diff = p.v - first;
              return (
                <div className="rounded-sm border border-neon-300/30 bg-ink-950/95 px-3.5 py-2.5">
                  <p className="text-[11px] text-ink-400">{fmtTime(p.t, range)}</p>
                  <p className="num text-sm font-bold text-ink-50">{hideBalances && money ? '₹ ••••' : money ? inr(p.v) : p.v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                  <p className={cn('num text-[11px] font-semibold', diff >= 0 ? 'text-gain' : 'text-loss')}>{pct((diff / first) * 100)}</p>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} fill={`url(#${gid})`} style={{ filter: `drop-shadow(0 0 4px ${color}99)` }} animationDuration={700} activeDot={{ r: 5, fill: color, stroke: '#030705', strokeWidth: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Credit-score-like semicircle gauge
export function ScoreGauge({ score, band, size = 220 }) {
  const min = 300;
  const max = 900;
  const p = Math.min(Math.max((score - min) / (max - min), 0), 1);
  const r = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const arc = Math.PI * r;
  const angle = Math.PI * (1 - p);
  const kx = cx + r * Math.cos(angle);
  const ky = cy - r * Math.sin(angle);
  const gid = useId().replace(/:/g, '');
  return (
    <div className="relative" style={{ width: size, height: size / 2 + 34 }}>
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <defs>
          <linearGradient id={gid} x1="0" x2="1">
            <stop offset="0" stopColor="#ff4d6a" />
            <stop offset="0.45" stopColor="#ffb547" />
            <stop offset="1" stopColor="#2bf08a" />
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#122016" strokeWidth="14" strokeDasharray="3 3" />
        <motion.path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="14"
          strokeDasharray={arc}
          initial={{ strokeDashoffset: arc }}
          animate={{ strokeDashoffset: arc * (1 - p) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.rect x={kx - 5} y={ky - 11} width="10" height="22" fill="#ecfdf0" stroke="#030705" strokeWidth="3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="num font-display text-7xl leading-none text-neon">{score}</p>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-ink-200">{band}</p>
      </div>
    </div>
  );
}

export function AllocationDonut({ data, size = 180, center }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={size * 0.36} outerRadius={size * 0.48} paddingAngle={2} stroke="none" cornerRadius={0} animationDuration={800}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-sm border border-neon-300/30 bg-ink-950 px-3 py-2 text-xs">
                  <p className="font-semibold text-ink-50">{payload[0].name}</p>
                  <p className="num text-ink-300">{payload[0].payload.weight.toFixed(1)}%</p>
                </div>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      {center && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}

export const shortMoney = (v, hide) => (hide ? '₹ ••' : compact(v));
