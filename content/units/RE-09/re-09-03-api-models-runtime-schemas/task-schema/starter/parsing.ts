// Shared parsing helpers. Read-only.
export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Parses every item of a list with `parseItem`. One bad item makes the whole list fail;
// its errors are reported as "<index>.<field>".
export function parseList<T>(input: unknown, parseItem: (item: unknown) => ParseResult<T>): ParseResult<T[]> {
  if (!Array.isArray(input)) return { ok: false, errors: { list: "notArray" } };
  const value: T[] = [];
  const errors: Record<string, string> = {};
  input.forEach((item, index) => {
    const result = parseItem(item);
    if (result.ok) value.push(result.value);
    else for (const [field, message] of Object.entries(result.errors)) errors[`${index}.${field}`] = message;
  });
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}
