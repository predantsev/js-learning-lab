import { type Wish, validateItem } from "./wish.ts";

export type ParseResult =
  | { ok: true; value: Wish[] }
  | { ok: false; errors: string[] };

export function parseStoredWishes(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["invalid-json"] };
  }
  if (!Array.isArray(data)) {
    return { ok: false, errors: ["not-an-array"] };
  }
  const wishes: Wish[] = [];
  const errors: string[] = [];
  data.forEach((item: unknown, index: number) => {
    const result = validateItem(item);
    if (result.ok) {
      wishes.push(result.value);
    } else {
      for (const field of Object.keys(result.errors)) {
        errors.push(`${index}.${field}`);
      }
    }
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: wishes };
}

const good = '[{"id":"w-02","name":"%%lamp%%","price":45,"acquired":false,"category":null}]';
const bad = '[{"id":"w-01","name":"%%headphones%%","price":"80","acquired":false,"category":null}]';

console.log(JSON.stringify(parseStoredWishes(good)));
console.log(JSON.stringify(parseStoredWishes(bad)));
