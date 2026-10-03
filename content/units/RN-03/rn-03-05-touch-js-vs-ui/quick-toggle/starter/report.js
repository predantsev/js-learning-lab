// report.js: an expensive report over the whole history. Do not edit.
// 50,000 synthetic archived tasks, sorted by title together with the current ones.
const archive = Array.from({ length: 50000 }, (_, i) => ({
  id: `a-${i}`,
  title: `Archived ${(i * 7919) % 50000}`,
  done: true,
}));

export const reportStarts = []; // when each report started (performance.now())

export function buildReport(tasks) {
  reportStarts.push(performance.now());
  const sorted = [...archive, ...tasks].sort((a, b) => a.title.localeCompare(b.title, 'uk'));
  return { total: sorted.length, done: sorted.filter((task) => task.done).length };
}
