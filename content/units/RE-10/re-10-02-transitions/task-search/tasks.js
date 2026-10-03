const titles = ["%%plants%%", "%%library%%", "%%grandma%%", "%%internet%%", "%%dentist%%", "%%wardrobe%%"];

// 5,000 synthetic tasks: the six planner tasks repeated, each with its own number.
export const tasks = Array.from({ length: 5000 }, (_, i) => ({
  id: `t-${i + 1}`,
  title: `${titles[i % titles.length]} #${i + 1}`,
}));
