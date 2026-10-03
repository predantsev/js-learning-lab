import { useCallback, useEffectEvent } from 'react';
import { AppState } from './appStateSim.jsx';
import { useFocusEffect } from './navSim.jsx';

// Calls onActive every time the app comes back to the foreground — but only while this screen is focused.
export function useAppStateRefresh(onActive) {
  // The listener keeps the onActive of the render in which the screen gained focus.
  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', (next) => {
        if (next === 'active') onActive();
      });
      return () => subscription.remove();
    }, []),
  );
}
