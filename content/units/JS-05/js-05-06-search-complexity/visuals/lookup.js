const habits = [
  { id: "h-01" },
  { id: "h-02" },
  { id: "h-03" },
  { id: "h-04" },
];

let comparisons = 0;
const findById = (id) =>
  habits.find((habit) => {
    comparisons = comparisons + 1;
    return habit.id === id;
  });

findById("h-01");
findById("h-04");
findById("h-99");

const byId = {};
for (const habit of habits) {
  byId[habit.id] = habit;
}
const found = byId["h-04"];
console.log(comparisons, found.id);
