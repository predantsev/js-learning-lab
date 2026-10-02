import { type Wish, validateItem } from "./wish.ts";

export type ParseResult =
  | { ok: true; value: Wish[] }
  | { ok: false; errors: string[] };

export function parseStoredWishes(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) as Wish[] };
  } catch {
    return { ok: false, errors: ["invalid-json"] };
  }
}

const good = '[{"id":"w-02","name":"%%lamp%%","price":45,"acquired":false,"category":null}]';
const bad = '[{"id":"w-01","name":"%%headphones%%","price":"80","acquired":false,"category":null}]';

console.log(JSON.stringify(parseStoredWishes(good)));
console.log(JSON.stringify(parseStoredWishes(bad)));
