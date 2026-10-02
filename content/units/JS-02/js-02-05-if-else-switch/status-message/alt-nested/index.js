// A nested if inside else picks the same single branch as else if.
const doneWord = "%%done%%";
const noDateWord = "%%noDate%%";
const dueWord = "%%due%%";

const bill = { title: "%%bill%%", dueDate: "2026-02-27", done: true };
const grandma = { title: "%%grandma%%", dueDate: null, done: false };
const plants = { title: "%%plants%%", dueDate: "2026-03-02", done: false };

if (bill.done) {
  console.log(bill.title + ":", doneWord);
} else {
  if (bill.dueDate == null) {
    console.log(bill.title + ":", noDateWord);
  } else {
    console.log(bill.title + ":", dueWord, bill.dueDate);
  }
}

if (grandma.done) {
  console.log(grandma.title + ":", doneWord);
} else {
  if (grandma.dueDate == null) {
    console.log(grandma.title + ":", noDateWord);
  } else {
    console.log(grandma.title + ":", dueWord, grandma.dueDate);
  }
}

if (plants.done) {
  console.log(plants.title + ":", doneWord);
} else {
  if (plants.dueDate == null) {
    console.log(plants.title + ":", noDateWord);
  } else {
    console.log(plants.title + ":", dueWord, plants.dueDate);
  }
}
