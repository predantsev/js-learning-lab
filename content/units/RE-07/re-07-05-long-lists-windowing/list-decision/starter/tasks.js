// Synthetic tasks built from six base titles.
const TITLES = ["%%water%%", "%%library%%", "%%grandma%%", "%%internet%%", "%%dentist%%", "%%wardrobe%%"];

export function makeTasks(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `t-${index + 1}`,
    title: `${TITLES[index % TITLES.length]} ${index + 1}`,
    done: index % 4 === 0,
  }));
}
