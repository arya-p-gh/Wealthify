import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/AppContext';
import { Button, Field, Input, Modal, cn } from '../ui';

export const GOAL_TYPES = [
  { value: 'home', emoji: '🏡', label: 'Home' },
  { value: 'car', emoji: '🚗', label: 'Car' },
  { value: 'travel', emoji: '✈️', label: 'Travel' },
  { value: 'education', emoji: '🎓', label: 'Education' },
  { value: 'retirement', emoji: '🌴', label: 'Retirement' },
  { value: 'emergency', emoji: '🛟', label: 'Emergency' },
  { value: 'wedding', emoji: '💍', label: 'Wedding' },
  { value: 'other', emoji: '🎯', label: 'Other' },
];

const blank = () => ({
  title: '',
  category: 'home',
  emoji: '🏡',
  targetAmount: '',
  savedAmount: '',
  targetDate: new Date(Date.now() + 5 * 365 * 864e5).toISOString().slice(0, 10),
  expectedReturn: 12,
});

export default function GoalModal({ open, goal, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(goal ? { ...goal, targetDate: goal.targetDate.slice(0, 10) } : blank());
  }, [open, goal]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.title.trim()) return setError('Give your goal a name');
    if (!(Number(form.targetAmount) > 0)) return setError('Target amount must be greater than zero');
    setSaving(true);
    try {
      const body = { ...form, targetAmount: Number(form.targetAmount), savedAmount: Number(form.savedAmount) || 0, expectedReturn: Number(form.expectedReturn) };
      await api(goal ? `/goals/${goal._id}` : '/goals', { method: goal ? 'PUT' : 'POST', body });
      toast(goal ? 'Goal updated' : 'Goal created — let’s get there');
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit goal' : 'New goal'} subtitle="We'll tell you exactly how much to invest each month.">
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-2">
          {GOAL_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setForm({ ...form, category: t.value, emoji: t.emoji, title: form.title || '' })}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl border py-3 text-[11px] font-semibold transition',
                form.category === t.value ? 'border-neon-300/50 bg-neon-300/10 text-neon-100' : 'border-neon-300/[0.12] text-ink-300 hover:bg-neon-300/[0.05]'
              )}
            >
              <span className="text-xl">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
        <Field label="Goal name">
          <Input value={form.title} onChange={set('title')} maxLength={60} placeholder="Dream home in Pune" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Target amount">
            <Input type="number" prefix="₹" value={form.targetAmount} onChange={set('targetAmount')} placeholder="5000000" />
          </Field>
          <Field label="Saved so far">
            <Input type="number" prefix="₹" value={form.savedAmount} onChange={set('savedAmount')} placeholder="0" />
          </Field>
          <Field label="Target date">
            <Input type="date" value={form.targetDate} min={new Date().toISOString().slice(0, 10)} onChange={set('targetDate')} />
          </Field>
          <Field label="Expected return">
            <Input type="number" suffix="% p.a." value={form.expectedReturn} onChange={set('expectedReturn')} />
          </Field>
        </div>
        {error && <p className="text-sm text-loss">{error}</p>}
        <Button className="w-full" size="lg" onClick={save} loading={saving}>
          {goal ? 'Save goal' : 'Create goal'}
        </Button>
      </div>
    </Modal>
  );
}
