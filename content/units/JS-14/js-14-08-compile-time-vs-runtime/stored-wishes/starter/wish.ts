export interface Wish {
  readonly id: string;
  name: string;
  price: number | null;
  acquired: boolean;
  category: string | null;
}

export type ItemResult =
  | { ok: true; value: Wish }
  | { ok: false; errors: Record<string, string> };

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Checks one stored record at runtime. Error keys are field names.
export function validateItem(input: unknown): ItemResult {
  if (!isRecordLike(input)) {
    return { ok: false, errors: { record: "not-an-object" } };
  }
  const { id, name, price, acquired, category } = input;
  const errors: Record<string, string> = {};
  if (typeof id !== "string" || id === "") {
    errors.id = "required";
  }
  if (typeof name !== "string" || name.trim() === "") {
    errors.name = "required";
  }
  if (price !== null && (typeof price !== "number" || !Number.isInteger(price) || price < 0)) {
    errors.price = "not-a-price";
  }
  if (typeof acquired !== "boolean") {
    errors.acquired = "not-a-boolean";
  }
  if (category !== null && typeof category !== "string") {
    errors.category = "not-text";
  }
  if (
    typeof id === "string" &&
    typeof name === "string" &&
    (price === null || typeof price === "number") &&
    typeof acquired === "boolean" &&
    (category === null || typeof category === "string") &&
    Object.keys(errors).length === 0
  ) {
    return { ok: true, value: { id, name: name.trim(), price, acquired, category } };
  }
  return { ok: false, errors };
}
