import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

export function isAppVisible() {
  return Platform.OS === 'web'
    ? typeof document !== 'undefined' && document.visibilityState === 'visible'
    : AppState.currentState === 'active';
}

/** One request at a time; resume immediately when the app becomes visible. */
export function useAutoRefresh(task: () => Promise<void>, enabled = true) {
  const latest = useRef(task);
  useEffect(() => { latest.current = task; }, [task]);
  useEffect(() => {
    if (!enabled) return;
    let running = false;
    let stopped = false;
    const run = async () => {
      if (stopped || running || !isAppVisible()) return;
      running = true;
      try { await latest.current(); }
      finally { running = false; }
    };
    const resume = () => { void run(); };
    const timer = setInterval(resume, 5000);
    const subscription = AppState.addEventListener('change', resume);
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.addEventListener('visibilitychange', resume);
    return () => {
      stopped = true;
      clearInterval(timer);
      subscription.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') document.removeEventListener('visibilitychange', resume);
    };
  }, [enabled]);
}
