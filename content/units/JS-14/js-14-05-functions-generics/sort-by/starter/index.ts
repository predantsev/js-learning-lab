type Wish = { id: string; name: string; price: number };
type Priority = "low" | "normal" | "high";
type Task = { id: string; title: string; priority: Priority };

// TODO: make sortBy generic: it takes a read-only array of T and a key
// function (item: T) => number, and returns a NEW sorted array T[],
// smallest key first. The array it gets must stay unchanged.
function sortBy(items, key) {
  return items;
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
