import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { clearDemo, getProfile, hasDemo, startDemo as storeStart } from '../lib/store';

const AuthCtx = createContext(null);
const PrefsCtx = createContext(null);
const ToastCtx = createContext(null);

const readJSON = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch {
    return fallback;
  }
};

export function AppProvider({ children }) {
  // ---------- demo session (no accounts: everything lives in this browser) ----------
  const [user, setUser] = useState(() => (hasDemo() ? getProfile() : null));

  const startDemo = useCallback((mode = 'sample') => {
    setUser(storeStart(mode).profile);
  }, []);
  const clearAll = useCallback(() => {
    clearDemo();
    setUser(null);
  }, []);
  const updateUser = useCallback((u) => setUser(u), []);

  // ---------- prefs ----------
  const [prefs, setPrefs] = useState(() => readJSON('prefs', { hideBalances: false, reduceMotion: false, compactNumbers: true }));
  const setPref = useCallback((k, v) => {
    setPrefs((p) => {
      const next = { ...p, [k]: v };
      localStorage.setItem('prefs', JSON.stringify(next));
      return next;
    });
  }, []);

  // ---------- toasts ----------
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const auth = useMemo(() => ({ user, startDemo, clearAll, updateUser }), [user, startDemo, clearAll, updateUser]);
  const prefsVal = useMemo(() => ({ ...prefs, setPref }), [prefs, setPref]);

  return (
    <AuthCtx.Provider value={auth}>
      <PrefsCtx.Provider value={prefsVal}>
        <ToastCtx.Provider value={toast}>
          {children}
          <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-8">
            <AnimatePresence>
              {toasts.map((t) => {
                const Icon = t.tone === 'error' ? AlertTriangle : t.tone === 'info' ? Info : CheckCircle2;
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="pointer-events-auto flex max-w-md items-center gap-3 rounded-sm border border-neon-300/30 bg-ink-950/95 px-4 py-3 text-sm text-ink-50 backdrop-blur"
                    role="status"
                  >
                    <Icon size={18} className={t.tone === 'error' ? 'text-loss' : t.tone === 'info' ? 'text-neon-200' : 'text-gain'} />
                    <span>{t.message}</span>
                    <button
                      onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                      className="ml-1 text-ink-400 hover:text-ink-100"
                      aria-label="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ToastCtx.Provider>
      </PrefsCtx.Provider>
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export const usePrefs = () => useContext(PrefsCtx);
export const useToast = () => useContext(ToastCtx);
