// The async data layer of the wish list: one cache of query results for every screen, the list query
// and the mutations. The fixture API (data/api.ts) is the only source of the wishes; the cache keeps
// what it last answered under a key with the filter ("items:all", "items:wanted", "items:acquired").
//
// useItemsList(filter) — a query.
// - Returns { items, status, message, retriesLeft, retry }: the cached wishes of this filter (null
//   before the first answer), "loading" (nothing yet), "refreshing" (cached wishes stay on screen
//   while a newer answer is on its way), "ready" or "failed" (only when there is nothing to show).
// - Effect: asks the API on mount, when the filter changes, after an invalidation and after retry().
//   Its cleanup aborts the request, so a slower answer for an old filter never replaces the new one.
// - Retry: only from a button, never while a request is on its way, at most MAX_RETRIES times in a row.
//
// useItemMutations() — create, save, remove and the optimistic acquired toggle. Each starts from a
// handler, resolves to { ok: true } or { ok: false, message } and, after a successful write,
// invalidates every "items:" key: the lists and the summary read again.
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Wish } from "../domain/wishes.ts";
import { listItems, createItem, saveItem, deleteItem, ApiError } from "../data/api.ts";
import type { ListFilter } from "../data/api.ts";
import { parseItemList } from "../data/model.ts";
import type { WishFields } from "./itemsReducer.ts";

const MAX_RETRIES = 3;

type CacheValue = {
  entries: Record<string, Wish[]>;
  version: number; // grows with every invalidation; every "items:" query depends on it
  put: (key: string, items: Wish[]) => void;
  patch: (change: (items: Wish[]) => Wish[]) => void; // changes every cached list at once
  invalidate: () => void;
};

const CacheContext = createContext<CacheValue | null>(null);

export function ItemsCacheProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, Wish[]>>({});
  const [version, setVersion] = useState(0);
  const value: CacheValue = {
    entries: entries,
    version: version,
    put: (key, items) => setEntries((previous) => ({ ...previous, [key]: items })),
    patch: (change) => setEntries((previous) => Object.fromEntries(Object.entries(previous).map(([key, items]) => [key, change(items)]))),
    invalidate: () => setVersion((previous) => previous + 1),
  };
  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

function useCache(): CacheValue {
  const cache = useContext(CacheContext);
  if (cache === null) {
    throw new Error("The wish queries work only inside <ItemsCacheProvider>.");
  }
  return cache;
}

// What went wrong with a request: the status of an answer that is not ok, no connection, or data
// that could not be read.
function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    return "%%responseStatusLabel%% " + error.status;
  }
  if (typeof error === "object" && error !== null && "status" in error) {
    return "%%responseStatusLabel%% " + String(error.status);
  }
  if (error instanceof TypeError) {
    return "%%noConnectionLabel%%";
  }
  return "%%badDataLabel%%";
}

export type ListQuery = {
  items: Wish[] | null;
  status: "loading" | "refreshing" | "ready" | "failed";
  message: string;
  retriesLeft: number;
  retry: () => void;
};

export function useItemsList(filter: ListFilter): ListQuery {
  const cache = useCache();
  const key = "items:" + filter;
  const [attempt, setAttempt] = useState(0);
  const [request, setRequest] = useState({ pending: true, error: "", failures: 0 });

  useEffect(() => {
    const controller = new AbortController();
    setRequest((previous) => ({ ...previous, pending: true }));
    listItems(filter, controller.signal).then(
      (answer) => {
        // The boundary: only an answer that passes the schema reaches the cache.
        const parsed = parseItemList(answer);
        if (parsed.ok) {
          cache.put(key, parsed.value);
          setRequest({ pending: false, error: "", failures: 0 });
        } else {
          const fields = Object.entries(parsed.errors).map(([field, code]) => field + ": " + code);
          setRequest((previous) => ({ pending: false, error: "%%listLoadFailedMessage%% (%%badDataLabel%%: " + fields.join(", ") + ")", failures: previous.failures + 1 }));
        }
      },
      (error: unknown) => {
        // An abort is not an error: a newer request (or leaving the screen) replaced this one.
        if (!controller.signal.aborted) {
          setRequest((previous) => ({ pending: false, error: "%%listLoadFailedMessage%% (" + errorText(error) + ")", failures: previous.failures + 1 }));
        }
      },
    );
    return () => controller.abort();
    // `filter` is part of `key`, and cache.put only calls a state setter, so these are all it reads.
  }, [key, cache.version, attempt]);

  const items = cache.entries[key] ?? null;
  // The first failure is not a retry: after it the button may be pressed MAX_RETRIES times.
  const retriesLeft = MAX_RETRIES + 1 - request.failures;
  let status: ListQuery["status"] = "ready";
  if (request.pending) {
    status = items === null ? "loading" : "refreshing";
  } else if (request.error !== "" && items === null) {
    status = "failed";
  }
  return {
    items: items,
    status: status,
    // After a failed refresh the cached wishes stay, and the message says what happened.
    message: request.pending ? "" : request.error,
    retriesLeft: retriesLeft,
    retry: () => {
      if (!request.pending && retriesLeft > 0) {
        setAttempt((previous) => previous + 1);
      }
    },
  };
}

export type Result = { ok: true } | { ok: false; message: string };

export function useItemMutations() {
  const cache = useCache();

  async function run(write: () => Promise<void>, failure: string): Promise<Result> {
    try {
      await write();
      cache.invalidate();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: failure + " (" + errorText(error) + ")" };
    }
  }

  return {
    create: (fields: WishFields) => run(() => createItem(fields), "%%saveFailedMessage%%"),
    save: (id: string, fields: WishFields) => run(() => saveItem(id, fields), "%%saveFailedMessage%%"),
    remove: (id: string) => run(() => deleteItem(id), "%%deleteFailedMessage%%"),
    // Optimistic: every cached list shows the new mark at once. If the API refuses, only this wish
    // goes back to how it was, and the message names it.
    async toggleAcquired(item: Wish): Promise<Result> {
      const replaceWith = (next: Wish) => cache.patch((items) => items.map((one) => (one.id === item.id ? next : one)));
      replaceWith({ ...item, acquired: !item.acquired });
      const result = await run(() => saveItem(item.id, { name: item.name, price: item.price, category: item.category, acquired: !item.acquired }), "%%toggleFailedMessage%%".replace("{name}", item.name));
      if (!result.ok) {
        replaceWith(item);
      }
      return result;
    },
  };
}
