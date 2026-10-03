// 2,000 synthetic tasks built from six base titles.
const TITLES = ["%%water%%", "%%library%%", "%%grandma%%", "%%internet%%", "%%dentist%%", "%%wardrobe%%"];

export const TASKS = Array.from({ length: 2000 }, (_, index) => ({
  id: `t-${index + 1}`,
  title: `${TITLES[index % TITLES.length]} ${index + 1}`,
  done: false,
}));
