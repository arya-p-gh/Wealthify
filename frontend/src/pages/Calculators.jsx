import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, PageHeader, Segmented, Slider } from '../components/ui';
import { compact, inr } from '../lib/format';

const TABS = [
  { value: 'sip', label: 'SIP' },
  { value: 'stepup', label: 'Step-up SIP' },
  { value: 'lumpsum', label: 'Lumpsum' },
  { value: 'emi', label: 'Loan EMI' },
];

// Year-by-year schedule for SIP / step-up / lumpsum
function schedule({ mode, monthly, lump, rate, years, stepUp }) {
  const r = rate / 12 / 100;
  let value = mode === 'lumpsum' ? lump : 0;
  let invested = mode === 'lumpsum' ? lump : 0;
  let m = monthly;
  const rows = [];
  for (let y = 1; y <= years; y++) {
    for (let i = 0; i < 12; i++) {
      if (mode !== 'lumpsum') {
        value = (value + m) * (1 + r);
        invested += m;
      } else value *= 1 + r;
    }
    rows.push({ year: `Y${y}`, invested: Math.round(invested), gains: Math.round(value - invested), value: Math.round(value) });
    if (mode === 'stepup') m *= 1 + stepUp / 100;
  }
  return rows;
}

function emiCalc(P, annual, years) {
  const r = annual / 12 / 100;
  const n = years * 12;
  const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let bal = P;
  const rows = [];
  for (let y = 1; y <= years; y++) {
    let princ = 0;
    let interest = 0;
    for (let i = 0; i < 12 && bal > 0; i++) {
      const int = bal * r;
      const p = Math.min(emi - int, bal);
      bal -= p;
      princ += p;
      interest += int;
    }
    rows.push({ year: `Y${y}`, invested: Math.round(princ), gains: Math.round(interest), value: Math.round(bal) });
  }
  return { emi, total: emi * n, interest: emi * n - P, rows };
}

function Breakdown({ rows, labels }) {
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="year" tick={{ fill: '#4a6b55', fontSize: 10 }} axisLine={false} tickLine={false} interval={rows.length > 15 ? Math.ceil(rows.length / 10) : 0} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-xl border border-neon-300/20 bg-ink-800 px-3 py-2 text-xs">
                  <p className="mb-1 font-semibold text-ink-50">Year {label.slice(1)}</p>
                  <p className="num text-ink-300">{labels[0]}: {inr(payload[0].value, { decimals: 0 })}</p>
                  <p className="num text-neon-200">{labels[1]}: {inr(payload[1].value, { decimals: 0 })}</p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="invested" stackId="a" fill="#284432" radius={[0, 0, 4, 4]} />
          <Bar dataKey="gains" stackId="a" fill="#39ff95" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Calculators() {
  const [tab, setTab] = useState('sip');
  const [monthly, setMonthly] = useState(15000);
  const [lump, setLump] = useState(500000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);
  const [stepUp, setStepUp] = useState(10);
  const [loan, setLoan] = useState(5000000);
  const [loanRate, setLoanRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const rows = useMemo(() => schedule({ mode: tab, monthly, lump, rate, years, stepUp }), [tab, monthly, lump, rate, years, stepUp]);
  const emi = useMemo(() => emiCalc(loan, loanRate, tenure), [loan, loanRate, tenure]);
  const last = rows[rows.length - 1] || { invested: 0, gains: 0, value: 0 };
  const isEmi = tab === 'emi';
  const flat = useMemo(() => (tab === 'stepup' ? schedule({ mode: 'sip', monthly, lump, rate, years, stepUp: 0 }).at(-1)?.value : null), [tab, monthly, lump, rate, years]);

  const result = isEmi
    ? [
        ['Monthly EMI', emi.emi, true],
        ['Total interest', emi.interest],
        ['Total payable', emi.total],
      ]
    : [
        ['Future value', last.value, true],
        ['Total invested', last.invested],
        ['Wealth gained', last.gains],
      ];
  const shareA = isEmi ? loan / emi.total : last.invested / (last.value || 1);

  return (
    <div>
      <PageHeader eyebrow="Calculators" title="Plan it" accent="properly" subtitle="Drag the sliders. Everything updates instantly, with a year-by-year breakdown." />
      <Segmented options={TABS} value={tab} onChange={setTab} className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card raised className="space-y-8 !p-6 sm:!p-8">
          {tab === 'sip' || tab === 'stepup' ? (
            <Slider label="Monthly investment" value={monthly} onChange={setMonthly} min={500} max={500000} step={500} format={(v) => compact(v)} suffix="₹" />
          ) : null}
          {tab === 'lumpsum' && <Slider label="One-time investment" value={lump} onChange={setLump} min={10000} max={10000000} step={10000} format={(v) => compact(v)} suffix="₹" />}
          {tab === 'stepup' && <Slider label="Annual step-up" value={stepUp} onChange={setStepUp} min={1} max={50} format={(v) => `${v}%`} suffix="%" />}
          {!isEmi && (
            <>
              <Slider label="Expected return (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.5} format={(v) => `${v}%`} suffix="%" />
              <Slider label="Time period" value={years} onChange={setYears} min={1} max={40} format={(v) => `${v}y`} suffix="yrs" />
            </>
          )}
          {isEmi && (
            <>
              <Slider label="Loan amount" value={loan} onChange={setLoan} min={100000} max={50000000} step={50000} format={(v) => compact(v)} suffix="₹" />
              <Slider label="Interest rate (p.a.)" value={loanRate} onChange={setLoanRate} min={5} max={20} step={0.1} format={(v) => `${v}%`} suffix="%" />
              <Slider label="Tenure" value={tenure} onChange={setTenure} min={1} max={30} format={(v) => `${v}y`} suffix="yrs" />
            </>
          )}

          <div>
            <div className="mb-3 flex items-center gap-4 text-[11px] font-semibold text-ink-300">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ink-500" />{isEmi ? 'Principal paid' : 'Invested'}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-neon-300" />{isEmi ? 'Interest paid' : 'Returns'}</span>
            </div>
            <Breakdown rows={isEmi ? emi.rows : rows} labels={isEmi ? ['Principal', 'Interest'] : ['Invested', 'Returns']} />
          </div>
        </Card>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-sm border border-neon-300/[0.12] bg-gradient-to-br from-ink-750 to-ink-900 p-7 grain">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,rgba(57,255,149,0.16),transparent_60%)]" />
            <p className="eyebrow relative">{result[0][0]}</p>
            <p className="num relative mt-2 text-[42px] font-black leading-none text-neon">{inr(result[0][1], { decimals: 0 })}</p>
            <div className="relative mt-6 h-2 overflow-hidden rounded-full bg-neon-300">
              <div className="h-full bg-ink-500 transition-all duration-500" style={{ width: `${shareA * 100}%` }} />
            </div>
            <div className="relative mt-6 space-y-3">
              {result.slice(1).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-ink-300">{k}</span>
                  <span className="num font-bold text-ink-50">{inr(v, { decimals: 0 })}</span>
                </div>
              ))}
              {!isEmi && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-300">Money multiplied</span>
                  <span className="num font-bold text-gain">{(last.value / (last.invested || 1)).toFixed(2)}×</span>
                </div>
              )}
            </div>
          </div>

          {tab === 'stepup' && flat && (
            <Card className="!p-5 text-sm text-ink-300">
              Stepping up by <b className="text-ink-50">{stepUp}%</b> a year gets you <b className="text-gain">{inr(last.value - flat, { decimals: 0 })}</b> more than a flat SIP of the same starting amount.
            </Card>
          )}
          {isEmi && (
            <Card className="!p-5 text-sm text-ink-300">
              You'll pay <b className="text-loss">{((emi.interest / loan) * 100).toFixed(0)}%</b> of the loan amount as interest. Prepaying even one extra EMI a year can cut years off your tenure.
            </Card>
          )}
          {!isEmi && (
            <Card className="!p-5 text-sm text-ink-300">
              Adjusted for ~6% inflation, that's about <b className="text-ink-50">{inr(last.value / Math.pow(1.06, years), { decimals: 0 })}</b> in today's money.
            </Card>
          )}
          <p className="px-2 text-[11px] leading-relaxed text-ink-500">Projections assume a constant rate of return and are for illustration only. Actual market returns vary.</p>
        </div>
      </div>
    </div>
  );
}
