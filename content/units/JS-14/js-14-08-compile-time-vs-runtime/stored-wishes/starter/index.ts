import { type Wish, validateItem } from "./wish.ts";

export type ParseResult =
  | { ok: true; value: Wish[] }
  | { ok: false; errors: string[] };

// TODO: check the stored text instead of trusting it (validateItem is ready in wish.ts).
export function parseStoredWishes(text: string): ParseResult {
  return { ok: true, value: JSON.parse(text) as Wish[] };
}

const good = '[{"id":"w-02","name":"%%lamp%%","price":45,"acquired":false,"category":null}]';
const bad = '[{"id":"w-01","name":"%%headphones%%","price":"80","acquired":false,"category":null}]';

console.log(JSON.stringify(parseStoredWishes(good)));
console.log(JSON.stringify(parseStoredWishes(bad)));
