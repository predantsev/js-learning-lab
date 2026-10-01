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
if (bill.done) {
  console.log(bill.title + ":", doneWord);
} else if (bill.dueDate === null) {
  console.log(bill.title + ":", noDateWord);
} else {
  console.log(bill.title + ":", dueWord, bill.dueDate);
}

if (grandma.done) {
  console.log(grandma.title + ":", doneWord);
} else if (grandma.dueDate === null) {
  console.log(grandma.title + ":", noDateWord);
} else {
  console.log(grandma.title + ":", dueWord, grandma.dueDate);
}

if (plants.done) {
  console.log(plants.title + ":", doneWord);
} else if (plants.dueDate === null) {
  console.log(plants.title + ":", noDateWord);
} else {
  console.log(plants.title + ":", dueWord, plants.dueDate);
}
