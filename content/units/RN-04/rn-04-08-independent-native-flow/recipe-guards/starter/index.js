// Read-only: tries both functions on a few samples and prints the results.
import { hasUnsavedChanges, parseRecipeLink } from './recipes.js';

const show = (label, run) => {
  try {
    console.log(`${label} → ${JSON.stringify(run())}`);
  } catch (error) {
    console.log(`${label} → ${error.name}: ${error.message}`);
  }
};

for (const url of ['courselab://recipe/r-07', 'courselab://recipe/r%2D07', 'courselab://recipe/%E0%A4%A']) {
  show(url, () => parseRecipeLink(url));
}

const saved = { id: 'r-07', title: '%%soup%%', servings: 4, note: '' };
show('unchanged', () => hasUnsavedChanges({ title: '%%soup%%', servings: '4', note: '' }, saved));
show('servings 6', () => hasUnsavedChanges({ title: '%%soup%%', servings: '6', note: '' }, saved));
