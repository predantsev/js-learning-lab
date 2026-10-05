import { useCallback, useEffect, useState } from 'react';

function stateOf({ status, canAskAgain }) {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return canAskAgain ? 'denied' : 'blocked';
  return 'ask';
}

// Wrong on purpose: "once granted, a permission stays granted" — it checks only once, on mount.
export function usePermissionGate(adapter) {
  const [state, setState] = useState('checking');
  useEffect(() => {
    (async () => {
      if (!(await adapter.isAvailable())) setState('unavailable');
      else setState(stateOf(await adapter.getPermission()));
    })();
  }, [adapter]);
  const request = useCallback(async () => setState(stateOf(await adapter.requestPermission())), [adapter]);
  return { state, request };
}
