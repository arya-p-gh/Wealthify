import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

// Small data hook: fetch on mount / dep change, optional polling, manual reload.
export function useFetch(path, { poll = 0, enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(path && enabled));
  const ctrl = useRef();

  const load = useCallback(
    async (silent = false) => {
      if (!path || !enabled) return;
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      if (!silent) setLoading(true);
      try {
        const d = await api(path, { signal: ctrl.current.signal });
        setData(d);
        setError(null);
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path, enabled, ...deps]
  );

  useEffect(() => {
    load();
    if (!poll) return () => ctrl.current?.abort();
    const id = setInterval(() => document.visibilityState === 'visible' && load(true), poll);
    return () => {
      clearInterval(id);
      ctrl.current?.abort();
    };
  }, [load, poll]);

  return { data, error, loading, reload: load, setData };
}
