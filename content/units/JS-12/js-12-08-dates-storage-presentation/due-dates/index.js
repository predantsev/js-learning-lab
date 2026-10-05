// Due dates are stored as plain calendar dates: "YYYY-MM-DD" strings.
const tasks = [
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02" },
  { id: "t-02", title: "%%library%%", dueDate: "2026-03-01" },
  { id: "t-05", title: "%%dentist%%", dueDate: "2026-03-10" },
];

// "Today" is passed in, never read from the clock.
const today = "2026-03-02";

for (const task of tasks) {
  const due = task.dueDate <= today;
  console.log(task.id, task.dueDate, due ? "%%due%%" : "%%later%%");
}

// A Date object, by contrast, is one instant. Its text depends on the time zone it is shown in.
const instant = new Date("2026-03-01");
console.log("%%stored%%", instant.getTime());
console.log("%%console%%", instant);
const inNewYork = new Intl.DateTimeFormat("%%locale%%", { timeZone: "America/New_York", dateStyle: "long" });
console.log("%%newYork%%", inNewYork.format(instant));
