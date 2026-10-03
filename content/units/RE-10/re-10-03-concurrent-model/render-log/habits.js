const names = ["%%exercise%%", "%%reading%%", "%%water%%", "%%tidy%%", "%%words%%", "%%walk%%"];

// 3,000 synthetic habits: the six tracker habits repeated, each with its own number.
export const habits = Array.from({ length: 3000 }, (_, i) => ({
  id: `h-${i + 1}`,
  name: `${names[i % names.length]} #${i + 1}`,
}));
