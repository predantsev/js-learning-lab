// useResumeDay.js: when the app comes back to the foreground, the day may have changed overnight.
import { useEffect } from 'react';
import { today } from './day-clock/index.js';

export function useResumeDay(appState, clock, onDay) {
  useEffect(() => {
    const subscription = appState.addEventListener('change', (next) => {
      if (next === 'active') today(clock).then(onDay);
    });
    return () => subscription.remove();
  }, [appState, clock, onDay]);
}
