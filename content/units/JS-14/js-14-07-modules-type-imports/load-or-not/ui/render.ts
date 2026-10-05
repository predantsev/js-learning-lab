import type { Wish } from "../domain/wish.ts";

export function renderWish(wish: Wish): string {
  return wish.price === null ? wish.name : `${wish.name}: ${wish.price}`;
}
