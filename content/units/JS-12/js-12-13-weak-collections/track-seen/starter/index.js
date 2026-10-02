// Remembers which card objects the person has already seen, without keeping
// removed cards in memory. Only objects can be marked.
const seen = new Set();

function markSeen(card) {
  seen.add(card);
}

function wasSeen(card) {
  return seen.has(card);
}

// Why must a "completed lessons" counter live in a Map or an array, not here?
// Write your answer in this comment:
//

const card = { id: "w-01" };
markSeen(card);
console.log(wasSeen(card), wasSeen({ id: "w-01" }));
