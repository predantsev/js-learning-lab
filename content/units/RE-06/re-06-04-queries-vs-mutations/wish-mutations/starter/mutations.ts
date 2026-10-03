// Every mutation answers with a result instead of throwing: the caller checks `ok`.
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type Wish = { id: string; name: string; price: number | null; acquired: boolean };
export type NewWish = { name: string; price: number | null };

// POST /api/wishes with the input as JSON; the server answers 201 with the created wish.
export async function createRecord(input: NewWish): Promise<Result<Wish>> {
  return { ok: false, error: "createRecord is not written yet" };
}

// PATCH /api/wishes/<id> with only the changed fields; the server answers 200 with the whole wish.
export async function updateRecord(id: string, patch: Partial<Wish>): Promise<Result<Wish>> {
  return { ok: false, error: "updateRecord is not written yet" };
}
