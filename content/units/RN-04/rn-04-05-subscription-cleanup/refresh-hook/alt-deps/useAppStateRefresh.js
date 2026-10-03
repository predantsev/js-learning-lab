import { useCallback, useEffectEvent } from 'react';
import { AppState } from './appStateSim.jsx';
import { useFocusEffect } from './navSim.jsx';

// Calls onActive every time the app comes back to the foreground — but only while this screen is focused.
export function useAppStateRefresh(onActive) {
  // onActive as a dependency: a new onActive re-subscribes (the old subscription is removed first).
  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', (next) => {
        if (next === 'active') onActive();
      });
      return () => subscription.remove();
    }, [onActive]),
  );
}
