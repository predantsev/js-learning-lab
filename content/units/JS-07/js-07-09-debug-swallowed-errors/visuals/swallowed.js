function countDone(habits, day) {
  let count = 0;
  for (const habit of habits) {
    try {
      const done = habit.completions.includes(day);
      if (done) {
        count = count + 1;
      }
    } catch (error) {
    }
  }
  return count;
}

function saveAll(habits) {
  try {
    const text = JSON.stringify(habits);
    console.log("length " + text.length);
  } finally {
    return "saved";
  }
}

const habits = [
  { id: "h-03", completions: ["2026-03-01"] },
  { id: "h-07" },
];
console.log(countDone(habits, "2026-03-01"));

const looped = { id: "h-02" };
looped.self = looped;
console.log(saveAll([looped]));
