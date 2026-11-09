const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const inrFmt0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const inr = (n, { decimals = 2, sign = false } = {}) => {
  const v = Number(n) || 0;
  const s = (decimals === 0 ? inrFmt0 : inrFmt).format(Math.abs(v));
  const prefix = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${prefix}₹${s}`;
};

// Indian short scale: K, L (lakh), Cr (crore)
export const compact = (n, { sign = false } = {}) => {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  let s;
  if (a >= 1e7) s = `${(a / 1e7).toFixed(a >= 1e9 ? 0 : 2)}Cr`;
  else if (a >= 1e5) s = `${(a / 1e5).toFixed(2)}L`;
  else if (a >= 1e3) s = `${(a / 1e3).toFixed(1)}K`;
  else s = a.toFixed(0);
  const prefix = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${prefix}₹${s}`;
};

export const pct = (n, { sign = true, decimals = 2 } = {}) => {
  const v = Number(n) || 0;
  return `${v > 0 && sign ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(decimals)}%`;
};

export const num = (n) => inrFmt0.format(Number(n) || 0);

export const ticker = (symbol = '') => symbol.replace(/\.(BO|NS)$/, '').replace(/^\^/, '');

export const toneOf = (v) => (v > 0 ? 'text-gain' : v < 0 ? 'text-loss' : 'text-ink-300');

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'W';

// Is the Indian market (NSE/BSE) open right now? 9:15–15:30 IST, Mon–Fri.
export const marketStatus = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + (now.getTimezoneOffset() + 330) * 60000);
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const day = ist.getDay();
  const open = day > 0 && day < 6 && mins >= 555 && mins <= 930;
  return { open, label: open ? 'Market open' : 'Market closed' };
};

export const downloadCSV = (filename, rows) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
};
