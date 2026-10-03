import { useEffect, useState } from 'react';

export function usePermissionGate(adapter, subscribeForeground) {
  const [state, setState] = useState('checking');

  function show(answer) {
    if (answer.status === 'granted') setState('granted');
    else if (answer.status === 'undetermined') setState('ask');
    else if (answer.canAskAgain) setState('denied');
    else setState('blocked');
  }

  useEffect(() => {
    function check() {
      adapter.isAvailable().then((available) => {
        if (!available) setState('unavailable');
        else adapter.getPermission().then(show);
      });
    }
    check();
    const unsubscribe = subscribeForeground(check);
    return () => unsubscribe();
  }, [adapter, subscribeForeground]);

  return { state, request: () => adapter.requestPermission().then(show) };
}
