import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AppContext';
import AppShell from './components/layout/AppShell';
import { Skeleton } from './components/ui';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Markets = lazy(() => import('./pages/Markets'));
const StockDetail = lazy(() => import('./pages/StockDetail'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Goals = lazy(() => import('./pages/Goals'));
const Calculators = lazy(() => import('./pages/Calculators'));
const Settings = lazy(() => import('./pages/Settings'));

// Opening an app URL directly (e.g. a shared /markets link) starts the sample demo.
// Only on first load: after "Delete all data" the user is sent home instead.
function Protected({ children }) {
  const { user, startDemo } = useAuth();
  const [autoStart] = useState(() => !user);
  useEffect(() => {
    if (!user && autoStart) startDemo('sample');
  }, [user, autoStart, startDemo]);
  if (!user) return autoStart ? null : <Navigate to="/" replace />;
  return children;
}

const PageFallback = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-72" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-900" />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Protected><AppShell /></Protected>}>
          {[
            ['/dashboard', Dashboard],
            ['/portfolio', Portfolio],
            ['/markets', Markets],
            ['/stock/:symbol', StockDetail],
            ['/watchlist', Watchlist],
            ['/goals', Goals],
            ['/calculators', Calculators],
            ['/settings', Settings],
          ].map(([path, C]) => (
            <Route key={path} path={path} element={<Suspense fallback={<PageFallback />}><C /></Suspense>} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
