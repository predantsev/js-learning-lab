// Synthetic tasks for measuring: many records built from the titles of the starting tasks. The
// same count always gives the same list (no random numbers), so measurements can be repeated.
const TITLES = ["%%fixture1Name%%", "%%fixture2Name%%", "%%fixture3Name%%", "%%fixture4Name%%", "%%fixture5Name%%", "%%fixture6Name%%"];
const PRIORITIES = ["low", "normal", "high"];

// `count` tasks with the ids "s-1", "s-2", …, due on one of the 28 days of February 2026 (every
// seventh task has no due date); every fourth task is done.
export function makeSyntheticTasks(count) {
  const list = [];
  for (let index = 0; index < count; index += 1) {
    const day = String((index % 28) + 1).padStart(2, "0");
    list.push({
      id: "s-" + (index + 1),
      title: TITLES[index % TITLES.length] + " " + (index % 1000),
      dueDate: index % 7 === 0 ? null : "2026-02-" + day,
      done: index % 4 === 0,
      priority: PRIORITIES[index % PRIORITIES.length],
    });
  }
  return list;
}
