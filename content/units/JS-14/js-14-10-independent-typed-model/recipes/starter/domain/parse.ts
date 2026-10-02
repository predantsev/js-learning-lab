import type { Recipe } from "./recipe.ts";

export type ParseResult =
  | { ok: true; value: Recipe[] }
  | { ok: false; errors: string[] };

// TODO: parseRecipes (see the task).
export function parseRecipes(text: string): ParseResult {
  return { ok: true, value: [] };
}
