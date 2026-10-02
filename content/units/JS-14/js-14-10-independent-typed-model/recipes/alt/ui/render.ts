import type { Recipe } from "../domain/recipe.ts";

export function renderRecipe(recipe: Recipe): string {
  return `${recipe.title} (${recipe.course}, ${recipe.servings})`;
}
