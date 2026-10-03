import { useEffect, useState } from 'react';

const KEY = 'jsll.wishlist.v1';

// The data hook: it knows only the storage contract, not which store is behind it.
export function useWishes(storage) {
  const [state, setState] = useState({ status: 'loading', records: [] });

  useEffect(() => {
    let active = true;
    storage.getItem(KEY).then((text) => {
      if (!active) return;
      const records = text === null ? [] : JSON.parse(text).records;
      setState({ status: 'ready', records });
    });
    return () => {
      active = false;
    };
  }, [storage]);

  return state;
}
