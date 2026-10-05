const labels = ["%%groceries%%", "%%transitPass%%", "%%coffee%%", "%%bulbs%%", "%%cinema%%", "%%lunch%%"];

// 5,000 synthetic expenses: the six tracker expenses repeated, each with its own number.
export const expenses = Array.from({ length: 5000 }, (_, i) => ({
  id: `e-${i + 1}`,
  label: `${labels[i % labels.length]} #${i + 1}`,
}));
