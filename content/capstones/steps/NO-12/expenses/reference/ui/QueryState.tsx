// The state of a query in words, in a role="status" line that a screen reader reads without moving
// focus, and the retry button: shown after an error, hidden while a request is on its way (so one
// click sends one request), gone once the retries are used up.
import type { ListQuery } from "./expensesCache.tsx";

export function QueryState({ query }: { query: ListQuery }) {
  const text = query.status === "loading" ? "%%loadingListMessage%%" : query.status === "refreshing" ? "%%refreshingMessage%%" : query.message;
  return (
    <>
      <p role="status">{text}</p>
      {query.message !== "" &&
        (query.retriesLeft > 0 ? (
          <button type="button" onClick={query.retry}>
            %%retryLoadLabel%%
          </button>
        ) : (
          <p>%%noMoreRetriesMessage%%</p>
        ))}
    </>
  );
}
