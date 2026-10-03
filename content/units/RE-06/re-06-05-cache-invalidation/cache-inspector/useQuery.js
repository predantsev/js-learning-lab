import { useEffect, useState } from "react";
import { cache } from "./queryCache.js";

// Reads a query through the cache. `fetcher` must not change between renders
// (a function declared outside the component).
export function useQuery(key, fetcher) {
  const [, setVersion] = useState(0);

  // Re-render whenever the cache changes.
  useEffect(() => cache.subscribe(() => setVersion((version) => version + 1)), []);

  // Report whether this key is already cached when the component starts using it.
  useEffect(() => {
    console.log(cache.has(key) ? `cache hit ${key}` : `cache miss ${key}`);
  }, [key]);

  const cached = cache.has(key);

  useEffect(() => {
    if (cached) return;
    const controller = new AbortController();
    fetcher(key, controller.signal)
      .then((data) => cache.set(key, data))
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, [key, cached, fetcher]);

  return { data: cache.get(key), loading: !cached };
}
