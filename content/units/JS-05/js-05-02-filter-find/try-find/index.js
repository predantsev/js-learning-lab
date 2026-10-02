const tasks = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-02", title: "%%books%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
];

const pending = tasks.filter((task) => !task.done);
console.log(pending.map((task) => task.title));

const found = tasks.find((task) => task.id === "t-02");
console.log(found);

const missing = tasks.find((task) => task.id === "t-99");
console.log(missing);
