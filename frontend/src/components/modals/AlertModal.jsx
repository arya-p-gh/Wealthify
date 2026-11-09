import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { api } from '../../lib/api';
import { inr, ticker } from '../../lib/format';
import { useToast } from '../../context/AppContext';
import { Button, Field, Input, Modal } from '../ui';

export default function AlertModal({ item, onClose, onSaved }) {
  const toast = useToast();
  const [above, setAbove] = useState('');
  const [below, setBelow] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setAbove(item.alertAbove ?? '');
    setBelow(item.alertBelow ?? '');
    setNote(item.note ?? '');
  }, [item]);

  const save = async (clear) => {
    setSaving(true);
    try {
      await api(`/watchlist/${item._id}`, {
        method: 'PUT',
        body: clear ? { alertAbove: '', alertBelow: '' } : { alertAbove: above === '' ? '' : Number(above), alertBelow: below === '' ? '' : Number(below), note },
      });
      toast(clear ? 'Alerts cleared' : 'Price alert saved');
      onSaved?.();
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!item} onClose={onClose} title={`Alerts for ${item ? ticker(item.symbol) : ''}`} subtitle={item ? `Currently ${inr(item.currentPrice)}` : ''}>
      {item && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Alert when above" hint="Breakout target">
              <Input type="number" prefix="₹" value={above} onChange={(e) => setAbove(e.target.value)} placeholder={(item.currentPrice * 1.1).toFixed(0)} />
            </Field>
            <Field label="Alert when below" hint="Buy-the-dip level">
              <Input type="number" prefix="₹" value={below} onChange={(e) => setBelow(e.target.value)} placeholder={(item.currentPrice * 0.9).toFixed(0)} />
            </Field>
          </div>
          <Field label="Note">
            <Input value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} placeholder="Why are you watching this?" />
          </Field>
          <div className="flex gap-3">
            {(item.alertAbove != null || item.alertBelow != null) && (
              <Button variant="ghost" onClick={() => save(true)} disabled={saving}>
                Clear
              </Button>
            )}
            <Button className="flex-1" icon={BellRing} onClick={() => save(false)} loading={saving}>
              Save alert
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
