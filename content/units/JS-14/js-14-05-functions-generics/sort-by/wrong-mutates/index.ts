type Wish = { id: string; name: string; price: number };
type Priority = "low" | "normal" | "high";
type Task = { id: string; title: string; priority: Priority };

function sortBy<T>(items: T[], key: (item: T) => number): T[] {
  return items.sort((a, b) => key(a) - key(b));
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
