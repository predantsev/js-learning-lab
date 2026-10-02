import { indexById } from "./domain/helpers.ts";
import { parseRecipes } from "./domain/parse.ts";
import { renderRecipe } from "./ui/render.ts";

const stored = JSON.stringify([
  { id: "r-01", title: "%%stew%%", servings: 4, tags: ["%%vegetables%%"], rating: 5, course: "main" },
  { id: "r-02", title: "%%pie%%", servings: 8, tags: [], rating: null, course: "dessert" },
]);

const result = parseRecipes(stored);
if (result.ok) {
  const byId = indexById(result.value);
  const pie = byId.get("r-02");
  if (pie) {
    console.log(renderRecipe(pie));
  }
} else {
  console.log(result.errors.join(", "));
}

const damaged = parseRecipes('[{"id": "r-03", "title": "", "servings": 2.5, "tags": "sweet", "rating": 6, "course": "soup"}]');
console.log(damaged.ok ? "ok" : damaged.errors.join(", "));
