import { later, runLater, taskAt } from "./helpers.js";

// No task variable at all: with let i every reminder reads the i of its own pass.
for (let i = 0; i < 3; i++) {
  later(() => console.log("%%reminder%%" + taskAt(i).title));
}

function makeCardTitle(record) {
  return () => "%%cardPrefix%%" + record.title;
}

const wardrobe = { id: "t-06", title: "%%tidy%%", done: true };
const wardrobeCardTitle = makeCardTitle(wardrobe);
wardrobe.title = "%%tidyMore%%"; // the task was renamed after the card was made

runLater();
console.log(wardrobeCardTitle());
