// Portfolio maths + the "Wealth Score": a 300–900 health score in the spirit of a credit score.

export const SECTOR_COLORS = {
  IT: '#4dd8ff',
  Banking: '#39ff95',
  Finance: '#9dffc8',
  Energy: '#ffb547',
  Automobile: '#5b9cff',
  Pharma: '#c084fc',
  FMCG: '#ff7eb6',
  Metals: '#9fb3a6',
  Telecom: '#2de2d0',
  Infrastructure: '#a3e635',
  Power: '#ffe066',
  Retail: '#ff6b9a',
  'Real Estate': '#14d473',
  Paints: '#ff8f5c',
  Electronics: '#7aa2ff',
  Insurance: '#d9f99d',
  Industrial: '#67e8f9',
  Other: '#4a6b55',
};

export function summarize(holdings = []) {
  let invested = 0;
  let current = 0;
  let dayChange = 0;
  const bySector = {};
  const rows = holdings.map((h) => {
    const inv = h.averagePrice * h.quantity;
    const cur = (h.currentPrice || h.averagePrice) * h.quantity;
    const prev = (h.previousClose || h.currentPrice || h.averagePrice) * h.quantity;
    invested += inv;
    current += cur;
    dayChange += cur - prev;
    const sector = h.sector || 'Other';
    bySector[sector] = (bySector[sector] || 0) + cur;
    return {
      ...h,
      invested: inv,
      value: cur,
      pnl: cur - inv,
      pnlPct: inv ? ((cur - inv) / inv) * 100 : 0,
      dayChange: cur - prev,
      dayChangePct: prev ? ((cur - prev) / prev) * 100 : 0,
    };
  });
  rows.forEach((r) => (r.weight = current ? (r.value / current) * 100 : 0));
  const sectors = Object.entries(bySector)
    .map(([name, value]) => ({ name, value, weight: current ? (value / current) * 100 : 0, color: SECTOR_COLORS[name] || SECTOR_COLORS.Other }))
    .sort((a, b) => b.value - a.value);
  const pnl = current - invested;
  const prevTotal = current - dayChange;
  return {
    rows,
    sectors,
    invested,
    current,
    pnl,
    pnlPct: invested ? (pnl / invested) * 100 : 0,
    dayChange,
    dayChangePct: prevTotal ? (dayChange / prevTotal) * 100 : 0,
  };
}

export function wealthScore(summary, goals = []) {
  const { rows, sectors, pnlPct } = summary;
  if (!rows.length) return { score: 300, band: 'Getting started', factors: [] };

  // Diversification: number of holdings & sectors
  const divPts = Math.min(rows.length / 10, 1) * 0.5 + Math.min(sectors.length / 6, 1) * 0.5;
  // Concentration: penalise any single stock > 25% or sector > 40%
  const maxStock = Math.max(...rows.map((r) => r.weight));
  const maxSector = sectors[0]?.weight || 0;
  const concPts = Math.max(0, 1 - Math.max(0, maxStock - 25) / 50) * 0.5 + Math.max(0, 1 - Math.max(0, maxSector - 40) / 50) * 0.5;
  // Returns: -20% → 0, +30% → 1
  const retPts = Math.min(Math.max((pnlPct + 20) / 50, 0), 1);
  // Goals: having goals and being on track
  const goalPts = goals.length
    ? goals.reduce((s, g) => s + Math.min(g.savedAmount / g.targetAmount, 1), 0) / goals.length * 0.6 + 0.4
    : 0.2;

  const factors = [
    { key: 'Diversification', value: divPts, weight: 0.3, hint: `${rows.length} stocks across ${sectors.length} sectors` },
    { key: 'Concentration', value: concPts, weight: 0.25, hint: `Largest position ${maxStock.toFixed(0)}% · top sector ${maxSector.toFixed(0)}%` },
    { key: 'Returns', value: retPts, weight: 0.3, hint: `Overall ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%` },
    { key: 'Goal discipline', value: goalPts, weight: 0.15, hint: goals.length ? `${goals.length} active goals` : 'No goals set yet' },
  ];
  const raw = factors.reduce((s, f) => s + f.value * f.weight, 0);
  const score = Math.round(300 + raw * 600);
  const band = score >= 800 ? 'Excellent' : score >= 720 ? 'Very good' : score >= 640 ? 'Good' : score >= 520 ? 'Fair' : 'Needs work';
  return { score, band, factors };
}

export function insights(summary, goals = []) {
  const out = [];
  const { rows, sectors } = summary;
  if (!rows.length) return out;
  const top = sectors[0];
  if (top && top.weight > 40)
    out.push({ tone: 'warn', title: `${top.weight.toFixed(0)}% in ${top.name}`, body: 'Heavy sector concentration. Consider spreading new money across other sectors.' });
  const big = rows.filter((r) => r.weight > 25);
  big.forEach((r) => out.push({ tone: 'warn', title: `${r.companyName.split(' ')[0]} is ${r.weight.toFixed(0)}% of your portfolio`, body: 'A single stock above 25% adds a lot of risk.' }));
  const losers = rows.filter((r) => r.pnlPct < -15);
  if (losers.length)
    out.push({ tone: 'loss', title: `${losers.length} holding${losers.length > 1 ? 's' : ''} down 15%+`, body: `Review ${losers.map((l) => l.symbol.replace(/\.(BO|NS)$/, '')).join(', ')} — your thesis may have changed.` });
  const winners = rows.filter((r) => r.pnlPct > 40);
  if (winners.length)
    out.push({ tone: 'gain', title: `${winners.length} big winner${winners.length > 1 ? 's' : ''} (40%+)`, body: `${winners.map((l) => l.symbol.replace(/\.(BO|NS)$/, '')).join(', ')} up 40%+. Consider booking partial profits.` });
  if (sectors.length < 4)
    out.push({ tone: 'info', title: 'Room to diversify', body: `You're in ${sectors.length} sector${sectors.length > 1 ? 's' : ''}. 5–8 sectors usually smooth out volatility.` });
  if (!goals.length) out.push({ tone: 'info', title: 'Give your money a mission', body: 'Set a goal to see if your investments will get you there on time.' });
  return out.slice(0, 4);
}

// Future value of a monthly SIP
export const sipFV = (monthly, annualRate, years, stepUp = 0) => {
  const r = annualRate / 12 / 100;
  let fv = 0;
  let invested = 0;
  let m = monthly;
  for (let y = 0; y < years; y++) {
    for (let i = 0; i < 12; i++) {
      fv = (fv + m) * (1 + r);
      invested += m;
    }
    m *= 1 + stepUp / 100;
  }
  return { fv, invested };
};

// Monthly SIP needed to hit a target
export const sipNeeded = (target, annualRate, months, already = 0) => {
  const r = annualRate / 12 / 100;
  if (months <= 0) return Math.max(target - already, 0);
  const fvAlready = already * Math.pow(1 + r, months);
  const remaining = Math.max(target - fvAlready, 0);
  if (r === 0) return remaining / months;
  return remaining / (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
};
