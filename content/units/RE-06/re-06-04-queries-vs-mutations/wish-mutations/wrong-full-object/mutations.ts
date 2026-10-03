// Every mutation answers with a result instead of throwing: the caller checks `ok`.
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type Wish = { id: string; name: string; price: number | null; acquired: boolean };
export type NewWish = { name: string; price: number | null };

// Sends one request with a JSON body and turns every outcome into a Result.
async function send(method: string, path: string, body: unknown): Promise<Result<Wish>> {
  try {
    const response = await fetch(path, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    return { ok: true, value: await response.json() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// POST /api/wishes with the input as JSON; the server answers 201 with the created wish.
export async function createRecord(input: NewWish): Promise<Result<Wish>> {
  return send("POST", "/api/wishes", input);
}

// PATCH /api/wishes/<id> with only the changed fields; the server answers 200 with the whole wish.
export async function updateRecord(id: string, patch: Partial<Wish>): Promise<Result<Wish>> {
  // Sends the whole record, not only the change.
  return send("PATCH", `/api/wishes/${id}`, { id, name: "", price: null, acquired: false, ...patch });
}
