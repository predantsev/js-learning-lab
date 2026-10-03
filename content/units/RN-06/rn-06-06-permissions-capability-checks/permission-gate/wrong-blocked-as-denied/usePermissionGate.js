import { useCallback, useEffect, useState } from 'react';

// Wrong on purpose: canAskAgain is ignored, so after a final denial the screen keeps offering
// a request that no longer shows any dialog.
function stateOf({ status }) {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'ask';
}

export function usePermissionGate(adapter, subscribeForeground) {
  const [state, setState] = useState('checking');
  const check = useCallback(async () => {
    if (!(await adapter.isAvailable())) setState('unavailable');
    else setState(stateOf(await adapter.getPermission()));
  }, [adapter]);
  useEffect(() => {
    check();
    return subscribeForeground(check);
  }, [check, subscribeForeground]);
  const request = useCallback(async () => setState(stateOf(await adapter.requestPermission())), [adapter]);
  return { state, request };
}
