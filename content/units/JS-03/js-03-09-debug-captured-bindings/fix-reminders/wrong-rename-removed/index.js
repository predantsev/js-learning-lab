import { later, runLater, taskAt } from "./helpers.js";

for (let i = 0; i < 3; i++) {
  const task = taskAt(i);
  later(() => console.log("%%reminder%%" + task.title));
}

// "Fixed" by deleting the rename: the output no longer matches what the program is meant to show.
function makeCardTitle(record) {
  const title = record.title;
  return () => "%%cardPrefix%%" + title;
}

const wardrobe = { id: "t-06", title: "%%tidy%%", done: true };
const wardrobeCardTitle = makeCardTitle(wardrobe);

runLater();
console.log(wardrobeCardTitle());
