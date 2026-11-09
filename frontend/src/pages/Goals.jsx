import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Pencil, Plus, PlusCircle, Target, Trash2 } from 'lucide-react';
import { useFetch } from '../lib/useFetch';
import { api } from '../lib/api';
import { inr } from '../lib/format';
import { sipNeeded } from '../lib/analytics';
import { useToast } from '../context/AppContext';
import { Button, Card, Empty, Input, Modal, Money, PageHeader, Skeleton, cn } from '../components/ui';
import GoalModal from '../components/modals/GoalModal';

function monthsUntil(date) {
  const d = new Date(date);
  const n = new Date();
  return Math.max(0, (d.getFullYear() - n.getFullYear()) * 12 + d.getMonth() - n.getMonth());
}

function Ring({ value, size = 84 }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#122016" strokeWidth="7" fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#goal-ring)"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - Math.min(value, 1)) }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      <defs>
        <linearGradient id="goal-ring">
          <stop offset="0" stopColor="#14d473" />
          <stop offset="1" stopColor="#bbffd9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Goals() {
  const toast = useToast();
  const { data, loading, reload } = useFetch('/goals');
  const [modal, setModal] = useState({ open: false, goal: null });
  const [topUp, setTopUp] = useState(null);
  const [amount, setAmount] = useState('');
  const [confirm, setConfirm] = useState(null);
  const goals = data?.goals || [];

  const totals = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.targetAmount, 0);
    const saved = goals.reduce((s, g) => s + g.savedAmount, 0);
    const monthly = goals.reduce((s, g) => s + sipNeeded(g.targetAmount, g.expectedReturn, monthsUntil(g.targetDate), g.savedAmount), 0);
    return { target, saved, monthly };
  }, [goals]);

  const doTopUp = async () => {
    const v = Number(amount);
    if (!(v > 0)) return;
    try {
      await api(`/goals/${topUp._id}`, { method: 'PUT', body: { savedAmount: topUp.savedAmount + v } });
      const done = topUp.savedAmount + v >= topUp.targetAmount;
      toast(done ? `🎉 ${topUp.title} — goal reached!` : `Added ${inr(v, { decimals: 0 })} to ${topUp.title}`);
      setTopUp(null);
      setAmount('');
      reload(true);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async () => {
    try {
      await api(`/goals/${confirm._id}`, { method: 'DELETE' });
      toast('Goal deleted', 'info');
      setConfirm(null);
      reload(true);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Goals"
        title="Money with a"
        accent="mission"
        subtitle="Every goal gets a monthly SIP target based on time left and expected returns."
        actions={<Button icon={Plus} onClick={() => setModal({ open: true, goal: null })}>New goal</Button>}
      />

      {goals.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card className="!p-5">
            <p className="text-xs text-ink-400">Total saved</p>
            <Money value={totals.saved} decimals={0} className="mt-1.5 block text-2xl font-bold text-ink-50" />
            <p className="mt-1 text-xs text-ink-400">of {inr(totals.target, { decimals: 0 })}</p>
          </Card>
          <Card className="!p-5">
            <p className="text-xs text-ink-400">Overall progress</p>
            <p className="num mt-1.5 text-2xl font-bold text-ink-50">{totals.target ? ((totals.saved / totals.target) * 100).toFixed(1) : 0}%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
              <div className="h-full rounded-full bg-gradient-to-r from-neon-400 to-neon-100" style={{ width: `${Math.min((totals.saved / totals.target) * 100, 100)}%` }} />
            </div>
          </Card>
          <Card className="!p-5 border-neon-300/20">
            <p className="text-xs text-ink-400">Invest every month</p>
            <Money value={totals.monthly} decimals={0} className="mt-1.5 block text-2xl font-bold text-neon" />
            <p className="mt-1 text-xs text-ink-400">to hit all goals on time</p>
          </Card>
        </div>
      )}

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-56 rounded-3xl" />)}</div>
      ) : !goals.length ? (
        <Card>
          <Empty icon={Target} title="What are you saving for?" body="A home, a sabbatical, early retirement — name it, date it, and we'll do the maths." action={<Button icon={Plus} onClick={() => setModal({ open: true, goal: null })}>Create your first goal</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g, i) => {
            const progress = g.savedAmount / g.targetAmount;
            const months = monthsUntil(g.targetDate);
            const need = sipNeeded(g.targetAmount, g.expectedReturn, months, g.savedAmount);
            const done = progress >= 1;
            return (
              <motion.div key={g._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card raised className={cn('group relative h-full', done && 'border-gain/30')}>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Ring value={progress} />
                      <span className="absolute inset-0 grid place-items-center text-2xl">{g.emoji}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold tracking-tight text-ink-50">{g.title}</h3>
                      <p className="num mt-0.5 text-sm text-ink-300">
                        <Money value={g.savedAmount} decimals={0} /> / {inr(g.targetAmount, { decimals: 0 })}
                      </p>
                      <p className={cn('num mt-1 text-xs font-semibold', done ? 'text-gain' : 'text-neon-200')}>{done ? 'Goal reached 🎉' : `${(progress * 100).toFixed(1)}% there`}</p>
                    </div>
                    <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button onClick={() => setModal({ open: true, goal: g })} className="rounded-lg p-1.5 text-ink-400 hover:text-ink-100" aria-label="Edit goal"><Pencil size={14} /></button>
                      <button onClick={() => setConfirm(g)} className="rounded-lg p-1.5 text-ink-400 hover:text-loss" aria-label="Delete goal"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-ink-950/50 p-4 text-sm">
                    <div>
                      <p className="flex items-center gap-1 text-xs text-ink-400"><CalendarClock size={12} /> Time left</p>
                      <p className="mt-0.5 font-semibold text-ink-50">{months >= 12 ? `${Math.floor(months / 12)}y ${months % 12}m` : `${months} months`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-400">Monthly SIP needed</p>
                      <p className="num mt-0.5 font-semibold text-ink-50">{done ? '—' : inr(need, { decimals: 0 })}</p>
                    </div>
                  </div>
                  {!done && (
                    <Button variant="ghost" size="sm" icon={PlusCircle} className="mt-4 w-full" onClick={() => setTopUp(g)}>
                      Add savings
                    </Button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <GoalModal open={modal.open} goal={modal.goal} onClose={() => setModal({ open: false, goal: null })} onSaved={() => reload(true)} />

      <Modal open={!!topUp} onClose={() => setTopUp(null)} title={`Add to ${topUp?.title || ''}`} subtitle="Log money you've set aside for this goal.">
        <div className="space-y-4">
          <Input type="number" prefix="₹" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" autoFocus onKeyDown={(e) => e.key === 'Enter' && doTopUp()} />
          <div className="flex gap-2">
            {[5000, 10000, 25000, 50000].map((v) => (
              <button key={v} onClick={() => setAmount(String(v))} className="num flex-1 rounded-xl border border-neon-300/[0.12] py-2 text-xs font-semibold text-ink-200 hover:bg-neon-300/[0.07]">
                +{v >= 1000 ? `${v / 1000}K` : v}
              </button>
            ))}
          </div>
          <Button className="w-full" size="lg" onClick={doTopUp} disabled={!(Number(amount) > 0)}>Add savings</Button>
        </div>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Delete “${confirm?.title || ''}”?`} subtitle="Your progress for this goal will be lost.">
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" icon={Trash2} onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
