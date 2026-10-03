// Every mutation answers with a result instead of throwing: the caller checks `ok`.
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type Wish = { id: string; name: string; price: number | null; acquired: boolean };
export type NewWish = { name: string; price: number | null };

const JSON_HEADERS = { "content-type": "application/json" };

export function createRecord(input: NewWish): Promise<Result<Wish>> {
  return fetch("/api/wishes", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(input) })
    .then(async (response): Promise<Result<Wish>> =>
      response.ok ? { ok: true, value: await response.json() } : { ok: false, error: `status ${response.status}` },
    )
    .catch((error: Error): Result<Wish> => ({ ok: false, error: error.message }));
}

export function updateRecord(id: string, patch: Partial<Wish>): Promise<Result<Wish>> {
  return fetch(`/api/wishes/${id}`, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(patch) })
    .then(async (response): Promise<Result<Wish>> =>
      response.ok ? { ok: true, value: await response.json() } : { ok: false, error: `status ${response.status}` },
    )
    .catch((error: Error): Result<Wish> => ({ ok: false, error: error.message }));
}
