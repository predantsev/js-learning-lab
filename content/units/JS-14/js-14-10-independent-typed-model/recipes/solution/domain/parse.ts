import type { Course, Rating, Recipe } from "./recipe.ts";

export type ParseResult =
  | { ok: true; value: Recipe[] }
  | { ok: false; errors: string[] };

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCourse(value: unknown): value is Course {
  return value === "main" || value === "dessert";
}

function isRating(value: unknown): value is Rating {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((tag) => typeof tag === "string");
}

function checkRecipe(input: unknown): { recipe: Recipe | null; fields: string[] } {
  if (!isRecordLike(input)) {
    return { recipe: null, fields: ["record"] };
  }
  const { id, title, servings, tags, rating, course } = input;
  const fields: string[] = [];
  if (typeof id !== "string" || id === "") fields.push("id");
  if (typeof title !== "string" || title.trim() === "") fields.push("title");
  if (typeof servings !== "number" || !Number.isInteger(servings) || servings <= 0) fields.push("servings");
  if (!isTextList(tags)) fields.push("tags");
  if (rating !== null && !isRating(rating)) fields.push("rating");
  if (!isCourse(course)) fields.push("course");
  if (
    fields.length === 0 &&
    typeof id === "string" &&
    typeof title === "string" &&
    typeof servings === "number" &&
    isTextList(tags) &&
    (rating === null || isRating(rating)) &&
    isCourse(course)
  ) {
    return { recipe: { id, title: title.trim(), servings, tags: [...tags], rating, course }, fields };
  }
  return { recipe: null, fields };
}

export function parseRecipes(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["invalid-json"] };
  }
  if (!Array.isArray(data)) {
    return { ok: false, errors: ["not-an-array"] };
  }
  const recipes: Recipe[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  data.forEach((item: unknown, index: number) => {
    const { recipe, fields } = checkRecipe(item);
    for (const field of fields) {
      errors.push(`${index}.${field}`);
    }
    if (recipe !== null) {
      if (seen.has(recipe.id)) {
        errors.push(`${index}.duplicate-id`);
      } else {
        seen.add(recipe.id);
        recipes.push(recipe);
      }
    }
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: recipes };
}
