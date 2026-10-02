// One status line per task:
//   done                      -> "title: doneWord"
//   not done, no due date     -> "title: noDateWord"
//   not done, with a due date -> "title: dueWord dueDate"
const doneWord = "%%done%%";
const noDateWord = "%%noDate%%";
const dueWord = "%%due%%";

const bill = { title: "%%bill%%", dueDate: "2026-02-27", done: true };
const grandma = { title: "%%grandma%%", dueDate: null, done: false };
const plants = { title: "%%plants%%", dueDate: "2026-03-02", done: false };

// Write an if / else if / else chain for each task.
