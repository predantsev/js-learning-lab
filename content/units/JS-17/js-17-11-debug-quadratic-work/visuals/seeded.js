let reads = 0;
// The same work as completions.includes(day), with every comparison counted.
function includesCounted(list, value) {
  for (const item of list) {
    reads = reads + 1;
    if (item === value) return true;
  }
  return false;
}

const days = ["02-27", "02-28", "03-01", "03-02"];
const completions = ["02-27", "03-01", "03-02"];
const done = days.map((day) => includesCounted(completions, day));
console.log("reads", reads);

// The merge appends an older imported day at the end.
const merged = [...completions, "02-25"];
const sorted = merged.every((day, i) => i === 0 || merged[i - 1] < day);
console.log("sorted", sorted);

// A category that is its own parent.
const categories = { home: { id: "home", parentId: "home" } };
function depthOf(id, depth) {
  const category = categories[id];
  if (category.parentId === null) return depth;
  return depthOf(category.parentId, depth + 1);
}
depthOf("home", 1);
