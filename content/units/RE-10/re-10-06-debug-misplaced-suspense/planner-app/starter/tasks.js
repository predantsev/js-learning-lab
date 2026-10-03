const titles = ["%%plants%%", "%%library%%", "%%grandma%%", "%%internet%%", "%%dentist%%", "%%wardrobe%%"];
const dates = ["2026-03-02", "2026-03-01", null, "2026-02-27", "2026-03-10", "2026-03-05"];

// 3,000 synthetic tasks: the six planner tasks repeated; every fourth one is done.
export const tasks = Array.from({ length: 3000 }, (_, i) => ({
  id: `t-${i + 1}`,
  title: `${titles[i % titles.length]} #${i + 1}`,
  dueDate: dates[i % dates.length],
  done: i % 4 === 0,
}));
