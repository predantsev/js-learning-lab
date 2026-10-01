// The date is checked before done, so a finished task with a date still shows its date.
const doneWord = "%%done%%";
const noDateWord = "%%noDate%%";
const dueWord = "%%due%%";

const bill = { title: "%%bill%%", dueDate: "2026-02-27", done: true };
const grandma = { title: "%%grandma%%", dueDate: null, done: false };
const plants = { title: "%%plants%%", dueDate: "2026-03-02", done: false };

if (bill.dueDate !== null) {
  console.log(bill.title + ":", dueWord, bill.dueDate);
} else if (bill.done) {
  console.log(bill.title + ":", doneWord);
} else {
  console.log(bill.title + ":", noDateWord);
}

if (grandma.dueDate !== null) {
  console.log(grandma.title + ":", dueWord, grandma.dueDate);
} else if (grandma.done) {
  console.log(grandma.title + ":", doneWord);
} else {
  console.log(grandma.title + ":", noDateWord);
}

if (plants.dueDate !== null) {
  console.log(plants.title + ":", dueWord, plants.dueDate);
} else if (plants.done) {
  console.log(plants.title + ":", doneWord);
} else {
  console.log(plants.title + ":", noDateWord);
}
