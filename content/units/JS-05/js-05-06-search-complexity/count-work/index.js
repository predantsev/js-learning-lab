function makeHabits(count) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    list.push({ id: "h-" + i });
  }
  return list;
}

let comparisons = 0;
function findById(list, id) {
  return list.find((habit) => {
    comparisons = comparisons + 1;
    return habit.id === id;
  });
}

// The worst case of a found record: the last one.
for (const size of [10, 100, 1000]) {
  const habits = makeHabits(size);
  comparisons = 0;
  findById(habits, "h-" + size);
  console.log(size, "%%records%%", comparisons, "%%comparisons%%");
}

// 100 searches in a list of 1000: a new linear search every time.
const big = makeHabits(1000);
comparisons = 0;
for (let i = 1; i <= 100; i++) {
  findById(big, "h-" + i * 10);
}
console.log("100 × find:", comparisons, "%%comparisons%%");
