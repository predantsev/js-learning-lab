import { useCallback, useEffect, useState } from 'react';

// Turns a permission answer into the screen's state.
function stateOf({ status, canAskAgain }) {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return canAskAgain ? 'denied' : 'blocked';
  return 'ask';
}

export function usePermissionGate(adapter, subscribeForeground) {
  const [state, setState] = useState('checking');

  // Capability first, then the permission. Never shows a dialog.
  const check = useCallback(async () => {
    if (!(await adapter.isAvailable())) {
      setState('unavailable');
      return;
    }
    setState(stateOf(await adapter.getPermission()));
  }, [adapter]);

  // On mount, and again whenever the app comes back: the user may have changed it in the settings.
  useEffect(() => {
    check();
    return subscribeForeground(check);
  }, [check, subscribeForeground]);

  // Only here, at the moment of use, may the system dialog appear.
  const request = useCallback(async () => {
    setState(stateOf(await adapter.requestPermission()));
  }, [adapter]);

  return { state, request };
}
