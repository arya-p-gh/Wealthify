import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { inr, ticker } from '../../lib/format';
import { useToast } from '../../context/AppContext';
import { Button, Change, Field, Input, Modal, StockAvatar } from '../ui';
import StockPicker from './StockPicker';

// Add a new holding (or edit an existing one).
// `initialStock` lets other pages open this pre-filled (e.g. from stock detail).
export default function HoldingModal({ open, onClose, onSaved, editHolding, initialStock }) {
  const toast = useToast();
  const [stock, setStock] = useState(null);
  const [quote, setQuote] = useState(null);
  const [form, setForm] = useState({ quantity: '', averagePrice: '', buyDate: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editHolding) {
      setStock({ symbol: editHolding.symbol, name: editHolding.companyName, sector: editHolding.sector });
      setForm({
        quantity: editHolding.quantity,
        averagePrice: editHolding.averagePrice,
        buyDate: editHolding.buyDate ? editHolding.buyDate.slice(0, 10) : '',
        notes: editHolding.notes || '',
      });
    } else {
      setStock(initialStock || null);
      setForm({ quantity: '', averagePrice: '', buyDate: new Date().toISOString().slice(0, 10), notes: '' });
    }
  }, [open, editHolding, initialStock]);

  useEffect(() => {
    setQuote(null);
    if (!stock) return;
    api(`/stocks/price/${encodeURIComponent(stock.symbol)}`)
      .then((q) => {
        setQuote(q);
        if (!editHolding) setForm((f) => ({ ...f, averagePrice: f.averagePrice || q.price.toFixed(2) }));
      })
      .catch(() => {});
  }, [stock, editHolding]);

  const qty = Number(form.quantity) || 0;
  const avg = Number(form.averagePrice) || 0;

  const save = async () => {
    if (!(qty > 0) || !(avg > 0)) return setError('Enter a quantity and price greater than zero');
    setSaving(true);
    setError('');
    try {
      const body = { ...form, quantity: qty, averagePrice: avg, currentPrice: quote?.price };
      const res = editHolding
        ? await api(`/portfolio/${editHolding._id}`, { method: 'PUT', body })
        : await api('/portfolio', {
            method: 'POST',
            body: { ...body, symbol: stock.symbol, companyName: stock.name, exchange: stock.exchange },
          });
      toast(res.message || 'Saved');
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editHolding ? 'Edit holding' : stock ? 'Add to portfolio' : 'Pick a stock'}
      subtitle={!stock ? 'Search 90+ large-cap Indian stocks' : undefined}
    >
      {!stock ? (
        <StockPicker onPick={setStock} />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-3xl border border-neon-300/[0.12] bg-ink-900/60 p-4">
            {!editHolding && !initialStock && (
              <button onClick={() => setStock(null)} className="rounded-xl p-1.5 text-ink-300 hover:bg-neon-300/[0.07]" aria-label="Change stock">
                <ArrowLeft size={18} />
              </button>
            )}
            <StockAvatar symbol={stock.symbol} />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink-50">{ticker(stock.symbol)}</p>
              <p className="truncate text-xs text-ink-400">{stock.name}</p>
            </div>
            <div className="text-right">
              {quote ? (
                <>
                  <p className="num font-bold text-ink-50">{inr(quote.price)}</p>
                  <Change percent={quote.changePercent} />
                </>
              ) : (
                <p className="text-xs text-ink-400">Fetching price…</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity">
              <Input type="number" min="0" inputMode="decimal" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="10" autoFocus />
            </Field>
            <Field label="Avg. buy price">
              <Input type="number" min="0" inputMode="decimal" prefix="₹" value={form.averagePrice} onChange={(e) => setForm({ ...form, averagePrice: e.target.value })} />
            </Field>
            <Field label="Buy date">
              <Input type="date" value={form.buyDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, buyDate: e.target.value })} />
            </Field>
            <Field label="Note (optional)">
              <Input value={form.notes} maxLength={200} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Long-term bet" />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-neon-300/[0.05] px-4 py-3 text-sm">
            <span className="text-ink-300">Total investment</span>
            <span className="num font-bold text-ink-50">{inr(qty * avg)}</span>
          </div>
          {quote && qty > 0 && avg > 0 && (
            <div className="flex items-center justify-between px-1 text-sm">
              <span className="text-ink-400">Unrealised P&L at today's price</span>
              <Change value={(quote.price - avg) * qty} percent={((quote.price - avg) / avg) * 100} showIcon={false} />
            </div>
          )}
          {error && <p className="text-sm text-loss">{error}</p>}
          <Button className="w-full" size="lg" onClick={save} loading={saving}>
            {editHolding ? 'Save changes' : 'Add holding'}
          </Button>
        </div>
      )}
    </Modal>
  );
}
