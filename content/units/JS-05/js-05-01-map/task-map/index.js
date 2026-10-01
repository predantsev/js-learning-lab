const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-02", title: "%%books%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
];

const titles = tasks.map((task) => task.title);
console.log(titles);

// One word is missing in this callback: every slot gets undefined.
const marks = tasks.map((task) => {
  task.done ? "✓" : "·";
});
console.log(marks);
