import { useCallback, useEffect, useState } from 'react';

function stateOf({ status, canAskAgain }) {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return canAskAgain ? 'denied' : 'blocked';
  return 'ask';
}

// Wrong on purpose: "asking for every permission at launch is fine" — the dialog appears before
// the person has even seen the feature.
export function usePermissionGate(adapter, subscribeForeground) {
  const [state, setState] = useState('checking');
  const check = useCallback(async () => {
    if (!(await adapter.isAvailable())) setState('unavailable');
    else setState(stateOf(await adapter.requestPermission()));
  }, [adapter]);
  useEffect(() => {
    check();
    return subscribeForeground(check);
  }, [check, subscribeForeground]);
  const request = useCallback(async () => setState(stateOf(await adapter.requestPermission())), [adapter]);
  return { state, request };
}
