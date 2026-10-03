import { useCallback, useEffect, useRef } from 'react';
import { AppState } from './appStateSim.jsx';
import { useFocusEffect } from './navSim.jsx';

// Calls onActive every time the app comes back to the foreground — but only while this screen is focused.
export function useAppStateRefresh(onActive) {
  // The latest onActive kept in a ref, updated after every render.
  const latest = useRef(onActive);
  useEffect(() => {
    latest.current = onActive;
  });
  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', (next) => {
        if (next === 'active') latest.current();
      });
      return () => {
        subscription.remove();
      };
    }, []),
  );
}
