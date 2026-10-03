import { useCallback, useEffect, useEffectEvent } from 'react';
import { AppState } from './appStateSim.jsx';
import { useFocusEffect } from './navSim.jsx';

// Calls onActive every time the app comes back to the foreground — but only while this screen is focused.
export function useAppStateRefresh(onActive) {
  // Subscribes for the whole time the screen is mounted — also while another screen covers it.
  const onActiveEvent = useEffectEvent(onActive);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') onActiveEvent();
    });
    return () => subscription.remove();
  }, []);
}
