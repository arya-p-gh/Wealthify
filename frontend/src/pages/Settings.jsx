import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Download, RotateCcw, Save, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { downloadCSV, initials } from '../lib/format';
import { useAuth, usePrefs, useToast } from '../context/AppContext';
import { Button, Card, Field, Input, Modal, PageHeader, SectionTitle, Select, cn } from '../components/ui';

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-ink-50">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-neon-300' : 'bg-ink-700')}
      >
        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-ink-50 shadow transition-all', checked ? 'left-6' : 'left-1')} />
      </button>
    </label>
  );
}

export default function Settings() {
  const { user, updateUser, startDemo, clearAll } = useAuth();
  const prefs = usePrefs();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'sample' | 'empty' | 'clear'

  useEffect(() => {
    setForm({
      name: user?.name || '',
            phone: user?.phone || '',
      location: user?.location || '',
      occupation: user?.occupation || '',
      bio: user?.bio || '',
      riskProfile: user?.riskProfile || 'moderate',
      monthlyIncome: user?.monthlyIncome || '',
    });
  }, [user]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const d = await api('/auth/profile', { method: 'PUT', body: { ...form, monthlyIncome: Number(form.monthlyIncome) || 0 } });
      updateUser(d.user);
      toast('Profile saved in this browser');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportHoldings = async () => {
    const { holdings } = await api('/portfolio?refresh=0');
    downloadCSV('wealthify-holdings.csv', [
      ['Symbol', 'Company', 'Quantity', 'Avg price', 'Last price'],
      ...holdings.map((h) => [h.symbol, h.companyName, h.quantity, h.averagePrice, h.currentPrice]),
    ]);
  };

  const CONFIRM = {
    sample: { title: 'Reset to sample data?', body: 'Your holdings, watchlist and goals will be replaced with the sample portfolio.', label: 'Reset' },
    empty: { title: 'Start with an empty portfolio?', body: 'Removes all holdings, watchlist items and goals so you can add your own.', label: 'Empty it' },
    clear: { title: 'Delete all demo data?', body: 'Wipes everything Wealthify saved in this browser and returns to the home page.', label: 'Delete' },
  };
  const runConfirm = () => {
    if (confirm === 'clear') {
      clearAll(); // the app shell redirects home once the data is gone
      return;
    }
    startDemo(confirm);
    toast(confirm === 'sample' ? 'Sample data restored' : 'Portfolio emptied', 'info');
    setConfirm(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Settings" title="Make it" accent="yours" />

      <Card raised className="mb-6 flex items-center gap-5 !p-6">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-sm border border-neon-300/40 bg-neon-300/10 text-neon-200 text-xl font-black">{initials(user?.name)}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold text-ink-50">{user?.name}</p>
          <p className="truncate text-sm text-ink-400">{user?.occupation || 'Investor'}</p>
          <p className="mt-1 text-xs text-ink-500">Demo profile · stored only in this browser</p>
        </div>
      </Card>

      <div className="grid gap-6">
        <Card>
          <SectionTitle eyebrow="Profile" title="Personal details" />
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name"><Input value={form.name || ''} onChange={set('name')} required /></Field>
              <Field label="Phone"><Input type="tel" value={form.phone || ''} onChange={set('phone')} placeholder="+91 98765 43210" /></Field>
              <Field label="Location"><Input value={form.location || ''} onChange={set('location')} placeholder="Bengaluru" /></Field>
              <Field label="Occupation"><Input value={form.occupation || ''} onChange={set('occupation')} placeholder="Product designer" /></Field>
              <Field label="Monthly income" hint="Private — used for savings-rate suggestions"><Input type="number" prefix="₹" value={form.monthlyIncome || ''} onChange={set('monthlyIncome')} /></Field>
              <Field label="Risk appetite" className="sm:col-span-2">
                <Select value={form.riskProfile || 'moderate'} onChange={set('riskProfile')}>
                  <option value="conservative">Conservative — protect capital first</option>
                  <option value="moderate">Moderate — balanced growth</option>
                  <option value="aggressive">Aggressive — maximise long-term growth</option>
                </Select>
              </Field>
              <Field label="Bio" className="sm:col-span-2">
                <textarea value={form.bio || ''} onChange={set('bio')} maxLength={280} rows={3} className="field resize-none" placeholder="A little about your investing style" />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" icon={Save} loading={saving}>Save profile</Button>
            </div>
          </form>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <SectionTitle eyebrow="Preferences" title="Display" />
            <div className="divide-y divide-neon-300/[0.12]">
              <Toggle label="Hide balances" hint="Mask amounts — handy in public" checked={prefs.hideBalances} onChange={(v) => prefs.setPref('hideBalances', v)} />
              <Toggle label="Compact numbers" hint="Show ₹12.4L instead of ₹12,40,000" checked={prefs.compactNumbers} onChange={(v) => prefs.setPref('compactNumbers', v)} />
            </div>
          </Card>

          <Card>
            <SectionTitle eyebrow="Data" title="Demo data" />
            <p className="mb-4 flex gap-2 text-[12px] leading-relaxed text-ink-400">
              <Database size={14} className="mt-0.5 shrink-0 text-neon-400" />
              There are no accounts. Your holdings, watchlist, goals and profile are saved in this browser only. Other devices and visitors won't see them.
            </p>
            <div className="grid gap-2">
              <Button variant="ghost" icon={Download} onClick={exportHoldings}>Export holdings (CSV)</Button>
              <Button variant="ghost" icon={RotateCcw} onClick={() => setConfirm('sample')}>Reset to sample data</Button>
              <Button variant="ghost" onClick={() => setConfirm('empty')}>Start with an empty portfolio</Button>
              <Button variant="danger" icon={Trash2} onClick={() => setConfirm('clear')}>Delete all data</Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={CONFIRM[confirm]?.title || ''} subtitle={CONFIRM[confirm]?.body}>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant={confirm === 'clear' ? 'danger' : 'primary'} className="flex-1" onClick={runConfirm}>{CONFIRM[confirm]?.label}</Button>
        </div>
      </Modal>
    </div>
  );
}
