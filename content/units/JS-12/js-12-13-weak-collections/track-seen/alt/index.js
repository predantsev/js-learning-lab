// Remembers which card objects the person has already seen, without keeping
// removed cards in memory. Only objects can be marked.
const seenAt = new WeakMap();

function markSeen(card) {
  seenAt.set(card, true);
}

function wasSeen(card) {
  return seenAt.get(card) === true;
}

// Why must a "completed lessons" counter live in a Map or an array, not here?
// Weak collections cannot be counted or listed, and when an entry disappears
// is up to the garbage collector, so a count kept here would be unknowable.

const card = { id: "w-01" };
markSeen(card);
console.log(wasSeen(card), wasSeen({ id: "w-01" }));
