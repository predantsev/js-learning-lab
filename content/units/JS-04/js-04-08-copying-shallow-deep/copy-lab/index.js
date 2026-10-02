// A habit with a nested completions array, and two kinds of copies.
const habit = {
  id: "h-03",
  name: "%%water%%",
  completions: ["2026-03-01"],
};

const copy = { ...habit };
copy.completions.push("2026-03-02");
console.log("habit.completions:", habit.completions);
console.log(
  "copy.completions === habit.completions:",
  copy.completions === habit.completions,
);

const clone = structuredClone(habit);
clone.completions.push("2026-03-03");
console.log("habit.completions:", habit.completions);
console.log(
  "clone.completions === habit.completions:",
  clone.completions === habit.completions,
);
