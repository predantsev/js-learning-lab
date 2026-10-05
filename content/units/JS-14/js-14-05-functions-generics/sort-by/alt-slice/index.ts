type Wish = { id: string; name: string; price: number };
type Priority = "low" | "normal" | "high";
type Task = { id: string; title: string; priority: Priority };

function sortBy<Item>(items: readonly Item[], key: (item: Item) => number): Item[] {
  const copy = items.slice();
  copy.sort((a, b) => {
    if (key(a) < key(b)) {
      return -1;
    }
    if (key(a) > key(b)) {
      return 1;
    }
    return 0;
  });
  return copy;
}

function priorityRank(priority: Priority): number {
  return priority === "high" ? 0 : priority === "normal" ? 1 : 2;
}

const wishes: Wish[] = [
  { id: "w-03", name: "%%bike%%", price: 240 },
  { id: "w-06", name: "%%mug%%", price: 18 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
];
const tasks: Task[] = [
  { id: "t-03", title: "%%grandma%%", priority: "low" },
  { id: "t-02", title: "%%books%%", priority: "high" },
  { id: "t-01", title: "%%water%%", priority: "normal" },
];

const cheapFirst = sortBy(wishes, (wish) => wish.price);
const urgentFirst = sortBy(tasks, (task) => priorityRank(task.priority));

console.log(cheapFirst.map((wish) => wish.id).join(" "));
console.log(urgentFirst.map((task) => task.id).join(" "));
console.log(wishes[0].id, tasks[0].id);
