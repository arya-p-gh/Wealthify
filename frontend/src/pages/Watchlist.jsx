import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, Plus, Star, Trash2 } from 'lucide-react';
import { useFetch } from '../lib/useFetch';
import { api } from '../lib/api';
import { inr, ticker } from '../lib/format';
import { useToast } from '../context/AppContext';
import { Button, Card, Change, Empty, Modal, PageHeader, Skeleton, Sparkline, StockAvatar, cn } from '../components/ui';
import StockPicker from '../components/modals/StockPicker';
import AlertModal from '../components/modals/AlertModal';

export default function Watchlist() {
  const toast = useToast();
  const { data, loading, reload } = useFetch('/watchlist', { poll: 60000 });
  const [adding, setAdding] = useState(false);
  const [alertFor, setAlertFor] = useState(null);
  const items = data?.items || [];
  const triggered = items.filter((i) => i.alertTriggered);

  const add = async (s) => {
    try {
      await api('/watchlist', { method: 'POST', body: { symbol: s.symbol, companyName: s.name, exchange: s.exchange } });
      toast(`${ticker(s.symbol)} added to watchlist ⭐`);
      setAdding(false);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async (it) => {
    try {
      await api(`/watchlist/${it._id}`, { method: 'DELETE' });
      toast(`${ticker(it.symbol)} removed`, 'info');
      reload(true);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Watchlist"
        title="On your"
        accent="radar"
        subtitle="Set price alerts for breakouts and dips. We check every minute while you're here."
        actions={<Button icon={Plus} onClick={() => setAdding(true)}>Add stock</Button>}
      />

      {triggered.length > 0 && (
        <div className="mb-6 rounded-3xl border border-neon-300/25 bg-neon-300/[0.06] p-5">
          <div className="mb-3 flex items-center gap-2">
            <BellRing size={17} className="text-neon-200" />
            <p className="font-bold text-ink-50">{triggered.length} alert{triggered.length > 1 ? 's' : ''} triggered</p>
          </div>
          <ul className="space-y-1 text-sm text-ink-200">
            {triggered.map((t) => (
              <li key={t._id}>
                <span className="font-semibold text-ink-50">{ticker(t.symbol)}</span> is at {inr(t.currentPrice)} —{' '}
                {t.alertAbove != null && t.currentPrice >= t.alertAbove ? `above your ${inr(t.alertAbove)} target` : `below your ${inr(t.alertBelow)} level`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-3xl" />)}</div>
      ) : !items.length ? (
        <Card>
          <Empty icon={Star} title="Your watchlist is empty" body="Add stocks you're curious about and set alerts so you never miss your price." action={<Button icon={Plus} onClick={() => setAdding(true)}>Add a stock</Button>} />
        </Card>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((it) => {
              const hasAlert = it.alertAbove != null || it.alertBelow != null;
              return (
                <motion.li key={it._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <div className={cn('surface flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5', it.alertTriggered && 'border-neon-300/30')}>
                    <Link to={`/stock/${encodeURIComponent(it.symbol)}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <StockAvatar symbol={it.symbol} />
                      <div className="min-w-0">
                        <p className="font-bold text-ink-50">{ticker(it.symbol)}</p>
                        <p className="truncate text-xs text-ink-400">{it.note || it.companyName}</p>
                      </div>
                    </Link>
                    <Sparkline data={it.spark} width={120} height={36} positive={it.priceChangePercent >= 0} className="hidden md:block" />
                    <div className="w-28 text-right">
                      {it.currentPrice > 0 ? (
                        <>
                          <p className="num font-bold text-ink-50">{inr(it.currentPrice)}</p>
                          <Change percent={it.priceChangePercent} />
                        </>
                      ) : (
                        <p className="text-xs text-ink-400">No data</p>
                      )}
                    </div>
                    <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
                      {hasAlert && (
                        <span className="num mr-2 hidden rounded-lg bg-neon-300/[0.05] px-2 py-1 text-[11px] text-ink-300 lg:inline">
                          {it.alertBelow != null && `↓ ${inr(it.alertBelow, { decimals: 0 })}`}
                          {it.alertBelow != null && it.alertAbove != null && ' · '}
                          {it.alertAbove != null && `↑ ${inr(it.alertAbove, { decimals: 0 })}`}
                        </span>
                      )}
                      <button
                        onClick={() => setAlertFor(it)}
                        className={cn('rounded-xl p-2.5 transition hover:bg-neon-300/[0.07]', hasAlert ? 'text-neon-200' : 'text-ink-400 hover:text-ink-100')}
                        aria-label={`Set price alert for ${ticker(it.symbol)}`}
                        title="Price alert"
                      >
                        {it.alertTriggered ? <BellRing size={17} /> : <Bell size={17} />}
                      </button>
                      <button onClick={() => remove(it)} className="rounded-xl p-2.5 text-ink-400 transition hover:bg-loss/10 hover:text-loss" aria-label={`Remove ${ticker(it.symbol)}`} title="Remove">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add to watchlist" subtitle="Search 90+ Indian large caps">
        <StockPicker onPick={add} />
      </Modal>
      <AlertModal item={alertFor} onClose={() => setAlertFor(null)} onSaved={() => reload(true)} />
    </div>
  );
}
