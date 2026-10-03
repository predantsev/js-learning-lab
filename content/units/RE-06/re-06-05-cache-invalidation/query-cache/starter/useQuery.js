import { useEffect, useState } from "react";

// Reads a query through the cache: cached data is served at once, and the query is fetched
// when its entry is missing or stale. `key` is an array such as ["tasks", "pending"];
// `fetcher(key, signal)` must not change between renders (declare it outside the component).
export function useQuery(cache, key, fetcher) {
  const [, setVersion] = useState(0);
  const keyText = JSON.stringify(key);

  // Re-render whenever the cache changes.
  useEffect(() => cache.subscribe(() => setVersion((version) => version + 1)), [cache]);

  const entry = cache.get(key);
  const needsFetch = entry === undefined || entry.stale;

  useEffect(() => {
    if (!needsFetch) return;
    const controller = new AbortController();
    const parts = JSON.parse(keyText);
    fetcher(parts, controller.signal)
      .then((data) => cache.set(parts, data))
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, [cache, keyText, needsFetch, fetcher]);

  return { data: entry?.data, loading: entry === undefined, refreshing: entry?.stale === true };
}
