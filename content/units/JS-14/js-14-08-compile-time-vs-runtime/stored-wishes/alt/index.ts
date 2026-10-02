import { type Wish, validateItem } from "./wish.ts";

export type ParseResult =
  | { ok: true; value: Wish[] }
  | { ok: false; errors: string[] };

function readJson(text: string): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

export function parseStoredWishes(text: string): ParseResult {
  const read = readJson(text);
  if (!read.ok) {
    return { ok: false, errors: ["invalid-json"] };
  }
  if (!Array.isArray(read.data)) {
    return { ok: false, errors: ["not-an-array"] };
  }
  const results = read.data.map((item: unknown) => validateItem(item));
  const errors = results.flatMap((result, index) =>
    result.ok ? [] : Object.keys(result.errors).map((field) => index + "." + field),
  );
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: results.flatMap((result) => (result.ok ? [result.value] : [])) };
}

const good = '[{"id":"w-02","name":"%%lamp%%","price":45,"acquired":false,"category":null}]';
const bad = '[{"id":"w-01","name":"%%headphones%%","price":"80","acquired":false,"category":null}]';

console.log(JSON.stringify(parseStoredWishes(good)));
console.log(JSON.stringify(parseStoredWishes(bad)));
