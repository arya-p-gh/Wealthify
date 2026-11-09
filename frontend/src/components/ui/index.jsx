import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import clsx from 'clsx';
import { Loader2, X } from 'lucide-react';
import { usePrefs } from '../../context/AppContext';
import { compact, inr, pct } from '../../lib/format';

export const cn = clsx;

// ---------------- Button ----------------
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading, icon: Icon, className, children, ...props },
  ref
) {
  const variants = {
    primary: 'bg-neon-300 text-ink-950 border border-neon-300 shadow-[0_0_24px_-6px_rgba(57,255,149,0.7)] hover:bg-neon-200',
    light: 'border border-neon-300/60 text-neon-300 hover:bg-neon-300 hover:text-ink-950',
    ghost: 'bg-neon-300/[0.03] text-ink-100 border border-neon-300/20 hover:border-neon-300/50 hover:text-neon-200',
    subtle: 'text-ink-200 hover:text-neon-200 hover:bg-neon-300/[0.06]',
    danger: 'bg-loss/10 text-loss border border-loss/30 hover:bg-loss/20',
  };
  const sizes = {
    sm: 'h-9 px-3.5 text-[12px] rounded-sm gap-1.5',
    md: 'h-11 px-5 text-[13px] rounded-sm gap-2',
    lg: 'h-14 px-7 text-[14px] rounded-sm gap-2.5',
    icon: 'h-10 w-10 rounded-sm',
  };
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'inline-flex select-none items-center justify-center font-bold uppercase tracking-[0.08em] transition-[background,filter,color,opacity] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : Icon ? <Icon size={size === 'sm' ? 15 : 17} strokeWidth={2.2} /> : null}
      {children}
    </motion.button>
  );
});

// ---------------- Card ----------------
export function Card({ className, children, raised, as: As = 'div', ...props }) {
  return (
    <As className={cn(raised ? 'surface-raised' : 'surface', 'p-5 sm:p-6', className)} {...props}>
      {children}
    </As>
  );
}

export function SectionTitle({ eyebrow, title, action, className }) {
  return (
    <div className={cn('mb-4 flex items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-[15px] font-bold uppercase tracking-[0.06em] text-ink-50">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ---------------- Inputs ----------------
export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-300">{label}</span>}
      {children}
      {(error || hint) && <span className={cn('mt-1.5 block text-xs', error ? 'text-loss' : 'text-ink-400')}>{error || hint}</span>}
    </label>
  );
}

export const Input = forwardRef(function Input({ className, prefix, suffix, ...props }, ref) {
  if (!prefix && !suffix) return <input ref={ref} className={cn('field', className)} {...props} />;
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-300">{prefix}</span>}
      <input ref={ref} className={cn('field', prefix && 'pl-9', suffix && 'pr-12', className)} {...props} />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-300">{suffix}</span>}
    </div>
  );
});

export function Select({ className, children, ...props }) {
  return (
    <select className={cn('field appearance-none pr-10', className)} {...props}>
      {children}
    </select>
  );
}

// Range slider with live value — used by calculators
export function Slider({ label, value, onChange, min, max, step = 1, format = (v) => v, suffix }) {
  const id = useId();
  const pctFill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-ink-200">
          {label}
        </label>
        <div className="flex items-center gap-1 rounded-sm border border-neon-300/15 bg-ink-950/70 px-3 py-1.5">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
            className="num w-24 bg-transparent text-right text-sm font-semibold text-ink-50 outline-none"
            aria-label={label}
          />
          {suffix && <span className="text-xs text-ink-300">{suffix}</span>}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none bg-ink-700 accent-neon-300 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-neon-300 [&::-webkit-slider-thumb]:shadow-glow"
        style={{ background: `linear-gradient(90deg, #39ff95 ${pctFill}%, #1a2e20 ${pctFill}%)` }}
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-400">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

// ---------------- Segmented control ----------------
export function Segmented({ options, value, onChange, className, size = 'md' }) {
  const id = useId();
  return (
    <div className={cn('inline-flex rounded-sm border border-neon-300/15 bg-ink-950/60 p-0.5', className)} role="tablist">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        const active = v === value;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={cn(
              'relative rounded-sm font-semibold uppercase transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]',
              active ? 'text-ink-950' : 'text-ink-300 hover:text-neon-200'
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-sm bg-neon-300 shadow-[0_0_14px_-2px_rgba(57,255,149,0.7)]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{l}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- Money (respects "hide balances") ----------------
export function Money({ value, compact: c, sign, className, decimals }) {
  const { hideBalances, compactNumbers } = usePrefs();
  if (hideBalances) return <span className={cn('num tracking-widest', className)}>₹ ••••</span>;
  const useCompact = c ?? false;
  return (
    <span className={cn('num', className)} title={inr(value)}>
      {useCompact && compactNumbers ? compact(value, { sign }) : inr(value, { sign, decimals })}
    </span>
  );
}

export function AnimatedMoney({ value, className }) {
  const { hideBalances } = usePrefs();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => inr(v));
  const prev = useRef(0);
  useEffect(() => {
    const ctrl = animate(mv, value || 0, { duration: prev.current ? 0.6 : 1.2, ease: [0.16, 1, 0.3, 1] });
    prev.current = value;
    return () => ctrl.stop();
  }, [value, mv]);
  if (hideBalances) return <span className={cn('num tracking-widest', className)}>₹ ••••••</span>;
  return <motion.span className={cn('num', className)}>{text}</motion.span>;
}

export function Change({ value, percent, className, showIcon = true, size = 'sm', pill }) {
  const up = (percent ?? value) >= 0;
    const { hideBalances } = usePrefs();
  return (
    <span
      className={cn(
        'num inline-flex items-center gap-1 font-semibold',
        up ? 'text-gain' : 'text-loss',
        pill && (up ? 'rounded-sm bg-gain-soft px-2 py-0.5' : 'rounded-sm bg-loss-soft px-2 py-0.5'),
        size === 'sm' ? 'text-[13px]' : 'text-sm',
        className
      )}
    >
      {showIcon && <span aria-hidden className="text-[0.8em]">{up ? '▲' : '▼'}</span>}
      {value !== undefined && !hideBalances && <span>{inr(value, { sign: true })}</span>}
      {percent !== undefined && <span className={value !== undefined && !hideBalances ? 'opacity-80' : ''}>{value !== undefined && !hideBalances ? `(${pct(percent)})` : pct(percent)}</span>}
    </span>
  );
}

// ---------------- Sparkline ----------------
export function Sparkline({ data = [], width = 96, height = 32, className, positive }) {
  const gid = useId();
  if (!data || data.length < 2) return <div style={{ width, height }} className={className} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * width, height - ((d - min) / span) * (height - 4) - 2]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const up = positive ?? data[data.length - 1] >= data[0];
  const color = up ? '#2bf08a' : '#ff4d6a';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}88)` }} />
    </svg>
  );
}

// ---------------- Modal / bottom sheet ----------------
export function Modal({ open, onClose, title, subtitle, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'relative max-h-[92vh] w-full overflow-y-auto rounded-sm border border-neon-300/30 bg-ink-850 p-6 shadow-[0_0_60px_-20px_rgba(57,255,149,0.35)] sm:p-8',
              size === 'lg' ? 'sm:max-w-2xl' : size === 'xl' ? 'sm:max-w-4xl' : 'sm:max-w-lg'
            )}
          >
            <div className="-mx-6 -mt-6 mb-5 flex items-center gap-1.5 border-b border-neon-300/15 bg-ink-900 px-4 py-2 sm:-mx-8 sm:-mt-8"><span className="h-2 w-2 bg-loss/70" /><span className="h-2 w-2 bg-amber/70" /><span className="h-2 w-2 bg-gain/70" /><span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-ink-400">wealthify://dialog</span></div>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink-50"><span className="text-neon">&gt;</span> {title}</h3>
                {subtitle && <p className="mt-1 text-sm text-ink-300">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="rounded-sm p-2 text-ink-300 hover:bg-loss/10 hover:text-loss" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ---------------- Misc ----------------
export function Skeleton({ className, style }) {
  return <div className={cn("skeleton", className)} style={style} />;
}

export function Empty({ icon: Icon, title, body, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-sm border border-neon-300/25 bg-neon-300/[0.04] shadow-[0_0_30px_-10px_rgba(57,255,149,0.6)]">
          <Icon size={26} className="text-neon-200" />
        </div>
      )}
      <h3 className="text-base font-bold text-ink-50">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-ink-300">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StockAvatar({ symbol = '', sector, size = 40 }) {
  const t = symbol.replace(/\.(BO|NS)$/, '').replace(/^\^/, '');
  const hue = 120 + ([...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 90, 7) - 45);
  return (
    <div
      className="grid shrink-0 place-items-center rounded-sm border font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        color: `hsl(${hue} 100% 70%)`,
        borderColor: `hsl(${hue} 100% 60% / 0.3)`,
        background: `hsl(${hue} 80% 50% / 0.07)`,
      }}
      title={sector}
    >
      {t.slice(0, 2)}
    </div>
  );
}

export function PageHeader({ eyebrow, title, accent, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-neon-300/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-[26px] font-extrabold leading-[1.15] text-ink-50 sm:text-[34px]">
          <span className="text-neon">$</span> {title} {accent && <span className="text-neon">{accent}</span>}
          <span className="cursor" />
        </h1>
        {subtitle && <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink-300">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
