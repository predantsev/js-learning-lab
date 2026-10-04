// useResumeDay.js: when the app comes back to the foreground, the day may have changed overnight.
import { useEffect } from 'react';
import { today } from './day-clock/index.js';

export function useResumeDay(appState, clock, onDay) {
  useEffect(() => {
    let mounted = true;
    const subscription = appState.addEventListener('change', async (next) => {
      if (next !== 'active') return;
      const day = await today(clock);
      if (mounted) onDay(day);
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [appState, clock, onDay]);
}
