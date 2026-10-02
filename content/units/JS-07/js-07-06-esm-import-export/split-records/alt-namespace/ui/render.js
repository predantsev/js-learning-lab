// All exports of the module under one name: records.validateRecord, records.summarize.
import * as records from "../domain/records.js";

export function render(habits) {
  const valid = habits.filter((habit) => records.validateRecord(habit).ok);
  const summary = records.summarize(valid);
  document.querySelector("#summary").textContent =
    "%%activeText%%" + summary.active + " / " + summary.count + " · %%completionsText%%" + summary.completions;
  const list = document.querySelector("#habits");
  list.replaceChildren();
  for (const habit of habits) {
    const item = document.createElement("li");
    item.textContent = records.validateRecord(habit).ok ? habit.name : "%%invalid%%" + habit.id;
    list.append(item);
  }
}
