import { useCallback, useEffectEvent } from 'react';
import { AppState } from './appStateSim.jsx';
import { useFocusEffect } from './navSim.jsx';

// Calls onActive every time the app comes back to the foreground — but only while this screen is focused.
export function useAppStateRefresh(onActive) {
  // Misconception: subscriptions go away by themselves when the screen loses focus.
  const onActiveEvent = useEffectEvent(onActive);
  useFocusEffect(
    useCallback(() => {
      AppState.addEventListener('change', (next) => {
        if (next === 'active') onActiveEvent();
      });
    }, []),
  );
}
