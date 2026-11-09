import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, BriefcaseBusiness, ChevronLeft, ChevronRight, Download, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useFetch } from '../lib/useFetch';
import { api } from '../lib/api';
import { downloadCSV, inr, ticker } from '../lib/format';
import { summarize } from '../lib/analytics';
import { useToast } from '../context/AppContext';
import { Button, Card, Change, Empty, Modal, Money, PageHeader, Select, Skeleton, StockAvatar, cn } from '../components/ui';
import HoldingModal from '../components/modals/HoldingModal';

const COLUMNS = [
  { key: 'symbol', label: 'Stock' },
  { key: 'quantity', label: 'Qty', num: true },
  { key: 'averagePrice', label: 'Avg. price', num: true },
  { key: 'currentPrice', label: 'LTP', num: true },
  { key: 'value', label: 'Current value', num: true },
  { key: 'dayChangePct', label: 'Day', num: true },
  { key: 'pnl', label: 'Returns', num: true },
  { key: 'weight', label: 'Weight', num: true },
];
const PAGE_SIZE = 10;

export default function Portfolio() {
  const toast = useToast();
  const { data, loading, reload } = useFetch('/portfolio', { poll: 60000 });
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('All');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'value', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, edit: null });
  const [confirm, setConfirm] = useState(null);
  const [menu, setMenu] = useState(null);

  const s = useMemo(() => summarize(data?.holdings || []), [data]);
  const sectors = ['All', ...new Set(s.rows.map((r) => r.sector || 'Other'))];

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = s.rows.filter(
      (h) =>
        (!term || h.symbol.toLowerCase().includes(term) || h.companyName.toLowerCase().includes(term)) &&
        (sector === 'All' || (h.sector || 'Other') === sector) &&
        (filter === 'all' || (filter === 'gainers' ? h.pnl >= 0 : h.pnl < 0))
    );
    r = [...r].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [s.rows, q, sector, filter, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const setSortKey = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

  const remove = async () => {
    try {
      await api(`/portfolio/${confirm._id}`, { method: 'DELETE' });
      toast(`${ticker(confirm.symbol)} removed from portfolio`);
      setConfirm(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const exportCsv = () => {
    downloadCSV(`wealthify-portfolio-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Symbol', 'Company', 'Sector', 'Quantity', 'Avg Price', 'LTP', 'Invested', 'Current Value', 'P&L', 'P&L %', 'Weight %'],
      ...s.rows.map((r) => [ticker(r.symbol), r.companyName, r.sector, r.quantity, r.averagePrice.toFixed(2), r.currentPrice.toFixed(2), r.invested.toFixed(2), r.value.toFixed(2), r.pnl.toFixed(2), r.pnlPct.toFixed(2), r.weight.toFixed(2)]),
    ]);
    toast('Portfolio exported as CSV', 'info');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Portfolio"
        title="Your"
        accent="holdings"
        subtitle="Live prices refresh every minute. Click any row for charts and details."
        actions={
          <>
            <Button variant="ghost" icon={Download} onClick={exportCsv} disabled={!s.rows.length}>
              Export
            </Button>
            <Button icon={Plus} onClick={() => setModal({ open: true, edit: null })}>
              Add holding
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Current value', s.current, null],
          ['Invested', s.invested, null],
          ["Today's P&L", s.dayChange, s.dayChangePct],
          ['Total returns', s.pnl, s.pnlPct],
        ].map(([label, v, p]) => (
          <Card key={label} className="!p-5">
            <p className="text-xs text-ink-400">{label}</p>
            {loading && !data ? (
              <Skeleton className="mt-2 h-7 w-28" />
            ) : (
              <Money value={v} sign={p != null} className={cn('mt-1.5 block text-xl font-bold sm:text-2xl', p == null ? 'text-ink-50' : v >= 0 ? 'text-gain' : 'text-loss')} />
            )}
            {p != null && <Change percent={p} showIcon={false} className="mt-1" />}
          </Card>
        ))}
      </div>

      <Card className="!p-0">
        <div className="flex flex-col gap-3 border-b border-neon-300/[0.12] p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search holdings"
              className="field !py-2.5 pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sector} onChange={(e) => { setSector(e.target.value); setPage(1); }} className="!py-2.5 sm:w-44" aria-label="Filter by sector">
              {sectors.map((x) => <option key={x}>{x}</option>)}
            </Select>
            <Select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="!py-2.5 sm:w-36" aria-label="Filter by returns">
              <option value="all">All</option>
              <option value="gainers">In profit</option>
              <option value="losers">In loss</option>
            </Select>
          </div>
        </div>

        {loading && !data ? (
          <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !s.rows.length ? (
          <Empty icon={BriefcaseBusiness} title="No holdings yet" body="Add the stocks you own to see live value, returns and allocation." action={<Button icon={Plus} onClick={() => setModal({ open: true, edit: null })}>Add your first holding</Button>} />
        ) : !rows.length ? (
          <p className="py-16 text-center text-sm text-ink-400">No holdings match your filters.</p>
        ) : (
          <>
            {/* desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neon-300/[0.12] text-[11px] uppercase tracking-[0.12em] text-ink-400">
                    {COLUMNS.map((c) => (
                      <th key={c.key} className={cn('px-5 py-3.5 font-semibold', c.num ? 'text-right' : 'text-left')}>
                        <button onClick={() => setSortKey(c.key)} className={cn('inline-flex items-center gap-1 hover:text-ink-100', sort.key === c.key && 'text-neon-200')}>
                          {c.label}
                          {sort.key === c.key && (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                        </button>
                      </th>
                    ))}
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((h) => (
                    <tr key={h._id} className="group border-b border-neon-300/[0.12] transition hover:bg-neon-300/[0.05]">
                      <td className="px-5 py-3.5">
                        <Link to={`/stock/${encodeURIComponent(h.symbol)}`} className="flex items-center gap-3">
                          <StockAvatar symbol={h.symbol} size={36} />
                          <div className="min-w-0">
                            <p className="font-semibold text-ink-50 group-hover:text-neon-100">{ticker(h.symbol)}</p>
                            <p className="max-w-[180px] truncate text-xs text-ink-400">{h.companyName}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="num px-5 text-right text-ink-200">{h.quantity}</td>
                      <td className="num px-5 text-right text-ink-200">{inr(h.averagePrice)}</td>
                      <td className="num px-5 text-right font-semibold text-ink-50">{inr(h.currentPrice)}</td>
                      <td className="px-5 text-right"><Money value={h.value} className="font-semibold text-ink-50" /></td>
                      <td className="px-5 text-right"><Change percent={h.dayChangePct} showIcon={false} /></td>
                      <td className="px-5 text-right">
                        <Money value={h.pnl} sign className={cn('block font-semibold', h.pnl >= 0 ? 'text-gain' : 'text-loss')} />
                        <span className={cn('num text-xs', h.pnl >= 0 ? 'text-gain/70' : 'text-loss/70')}>{h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%</span>
                      </td>
                      <td className="px-5 text-right">
                        <div className="ml-auto flex w-20 items-center justify-end gap-2">
                          <div className="h-1 w-10 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-neon-300" style={{ width: `${Math.min(h.weight, 100)}%` }} /></div>
                          <span className="num text-xs text-ink-300">{h.weight.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="relative pr-4">
                        <button onClick={() => setMenu(menu === h._id ? null : h._id)} className="rounded-lg p-1.5 text-ink-400 hover:bg-neon-300/[0.07] hover:text-ink-100" aria-label="Actions">
                          <MoreHorizontal size={16} />
                        </button>
                        {menu === h._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                            <div className="absolute right-4 top-11 z-20 w-36 rounded-2xl border border-neon-300/20 bg-ink-800 p-1.5">
                              <button onClick={() => { setModal({ open: true, edit: h }); setMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-ink-100 hover:bg-neon-300/[0.07]"><Pencil size={14} /> Edit</button>
                              <button onClick={() => { setConfirm(h); setMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-loss hover:bg-loss/10"><Trash2 size={14} /> Delete</button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <ul className="divide-y divide-neon-300/[0.12] md:hidden">
              {pageRows.map((h) => (
                <li key={h._id} className="flex items-center gap-3 p-4">
                  <Link to={`/stock/${encodeURIComponent(h.symbol)}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <StockAvatar symbol={h.symbol} />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-50">{ticker(h.symbol)}</p>
                      <p className="num text-xs text-ink-400">{h.quantity} × {inr(h.averagePrice)}</p>
                    </div>
                  </Link>
                  <div className="text-right">
                    <Money value={h.value} className="block font-semibold text-ink-50" />
                    <Change percent={h.pnlPct} showIcon={false} />
                  </div>
                  <button onClick={() => setModal({ open: true, edit: h })} className="rounded-lg p-2 text-ink-400" aria-label={`Edit ${ticker(h.symbol)}`}><Pencil size={15} /></button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between p-4 text-xs text-ink-400 sm:px-5">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="subtle" size="icon" onClick={() => setPage((p) => p - 1)} disabled={page === 1} aria-label="Previous page"><ChevronLeft size={16} /></Button>
                <span className="num px-2 font-semibold text-ink-200">{page} / {pages}</span>
                <Button variant="subtle" size="icon" onClick={() => setPage((p) => p + 1)} disabled={page === pages} aria-label="Next page"><ChevronRight size={16} /></Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <HoldingModal open={modal.open} editHolding={modal.edit} onClose={() => setModal({ open: false, edit: null })} onSaved={reload} />

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Remove ${confirm ? ticker(confirm.symbol) : ''}?`} subtitle="This deletes the holding from your portfolio. It can't be undone.">
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" icon={Trash2} onClick={remove}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
