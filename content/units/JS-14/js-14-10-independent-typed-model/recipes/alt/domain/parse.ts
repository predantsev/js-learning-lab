import type { Recipe } from "./recipe.ts";

export type ParseResult =
  | { ok: true; value: Recipe[] }
  | { ok: false; errors: string[] };

const COURSES: readonly unknown[] = ["main", "dessert"];
const RATINGS: readonly unknown[] = [1, 2, 3, 4, 5];

type RecipeCheck = { ok: true; recipe: Recipe } | { ok: false; fields: string[] };

function readJson(text: string): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function checkRecipe(input: unknown): RecipeCheck {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, fields: ["record"] };
  }
  const id = "id" in input ? input.id : undefined;
  const title = "title" in input ? input.title : undefined;
  const servings = "servings" in input ? input.servings : undefined;
  const tags = "tags" in input ? input.tags : undefined;
  const rating = "rating" in input ? input.rating : undefined;
  const course = "course" in input ? input.course : undefined;

  const goodId = typeof id === "string" && id.length > 0;
  const goodTitle = typeof title === "string" && title.trim().length > 0;
  const goodServings = Number.isInteger(servings) && typeof servings === "number" && servings > 0;
  const goodTags = Array.isArray(tags) && tags.every((tag) => typeof tag === "string");
  const goodRating = rating === null || RATINGS.includes(rating);
  const goodCourse = COURSES.includes(course);

  const fields = [
    goodId ? "" : "id",
    goodTitle ? "" : "title",
    goodServings ? "" : "servings",
    goodTags ? "" : "tags",
    goodRating ? "" : "rating",
    goodCourse ? "" : "course",
  ].filter((field) => field !== "");
  if (fields.length > 0) {
    return { ok: false, fields };
  }
  if (typeof id !== "string" || typeof title !== "string" || typeof servings !== "number" || !Array.isArray(tags)) {
    return { ok: false, fields: ["record"] };
  }
  const recipe: Recipe = {
    id,
    title: title.trim(),
    servings,
    tags: tags.filter((tag): tag is string => typeof tag === "string"),
    rating: rating === 1 || rating === 2 || rating === 3 || rating === 4 || rating === 5 ? rating : null,
    course: course === "dessert" ? "dessert" : "main",
  };
  return { ok: true, recipe };
}

export function parseRecipes(text: string): ParseResult {
  const read = readJson(text);
  if (!read.ok) {
    return { ok: false, errors: ["invalid-json"] };
  }
  if (!Array.isArray(read.data)) {
    return { ok: false, errors: ["not-an-array"] };
  }
  const recipes: Recipe[] = [];
  const errors: string[] = [];
  const ids = new Set<string>();
  read.data.forEach((item: unknown, index: number) => {
    const check = checkRecipe(item);
    if (!check.ok) {
      errors.push(...check.fields.map((field) => `${index}.${field}`));
    } else if (ids.has(check.recipe.id)) {
      errors.push(`${index}.duplicate-id`);
    } else {
      ids.add(check.recipe.id);
      recipes.push(check.recipe);
    }
  });
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: recipes };
}
