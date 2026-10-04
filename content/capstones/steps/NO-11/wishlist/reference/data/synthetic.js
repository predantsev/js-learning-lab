// Synthetic wishes for measuring: many records built from the names of the starting wishes. The
// same count always gives the same list (no random numbers), so measurements can be repeated.
const NAMES = ["%%fixture1Name%%", "%%fixture2Name%%", "%%fixture3Name%%", "%%fixture4Name%%", "%%fixture5Name%%", "%%fixture6Name%%"];
const CATEGORIES = ["%%techCategory%%", "%%homeCategory%%", "%%sportCategory%%", "%%booksCategory%%", null];

// `count` wishes with the ids "s-1", "s-2", …; a name repeats every 500 wishes, so a list of 1000
// has every name twice.
export function makeSyntheticWishes(count) {
  const list = [];
  for (let index = 0; index < count; index += 1) {
    const number = index % 500;
    list.push({
      id: "s-" + (index + 1),
      name: NAMES[number % NAMES.length] + " " + number,
      price: index % 10 === 0 ? null : (index * 37) % 500,
      acquired: index % 3 === 0,
      category: CATEGORIES[index % CATEGORIES.length],
    });
  }
  return list;
}
