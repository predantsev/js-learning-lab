const habit = {
  id: "h-03",
  completions: ["2026-03-01"],
};
const copy = { ...habit };
copy.completions.push("2026-03-02");
const clone = structuredClone(habit);
clone.completions.push("2026-03-03");
const labeled = { ...habit, label: () => "!" };
const back = JSON.parse(JSON.stringify(labeled));
console.log(habit.completions.length);
console.log(clone.completions.length);
console.log("label" in back);
