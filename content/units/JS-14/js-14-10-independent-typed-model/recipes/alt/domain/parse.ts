import type { Course, Recipe } from "./recipe.ts";

export type ParseResult =
  | { ok: true; value: Recipe[] }
  | { ok: false; errors: string[] };

type Rating = 1 | 2 | 3 | 4 | 5 | null;

const COURSES: readonly Course[] = ["main", "dessert"];
const RATINGS: readonly Rating[] = [null, 1, 2, 3, 4, 5];

function isCourse(value: unknown): value is Course {
  return COURSES.some((course) => course === value);
}

function isRating(value: unknown): value is Rating {
  return RATINGS.some((rating) => rating === value);
}

function isTagList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((tag) => typeof tag === "string");
}

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

  if (
    typeof id === "string" &&
    id !== "" &&
    typeof title === "string" &&
    title.trim() !== "" &&
    typeof servings === "number" &&
    Number.isInteger(servings) &&
    servings > 0 &&
    isTagList(tags) &&
    isRating(rating) &&
    isCourse(course)
  ) {
    return { ok: true, recipe: { id, title: title.trim(), servings, tags: [...tags], rating, course } };
  }

  const fields: string[] = [];
  if (typeof id !== "string" || id === "") {
    fields.push("id");
  }
  if (typeof title !== "string" || title.trim() === "") {
    fields.push("title");
  }
  if (typeof servings !== "number" || !Number.isInteger(servings) || servings <= 0) {
    fields.push("servings");
  }
  if (!isTagList(tags)) {
    fields.push("tags");
  }
  if (!isRating(rating)) {
    fields.push("rating");
  }
  if (!isCourse(course)) {
    fields.push("course");
  }
  return { ok: false, fields };
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
