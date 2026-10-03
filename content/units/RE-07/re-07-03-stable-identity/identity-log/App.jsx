import { useState } from "react";
import { useIdentityLog } from "./identity";

const TASKS = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
  { id: "t-05", title: "%%dentist%%", done: false },
];

export default function TaskBoard() {
  const [note, setNote] = useState("");
  const [sort, setSort] = useState("title");

  const sortOptions = ["title", "dueDate"];
  const visibleTasks = TASKS.filter((task) => !task.done);
  const onSelect = (option) => setSort(option);

  useIdentityLog("sortOptions", sortOptions);
  useIdentityLog("visibleTasks", visibleTasks);
  useIdentityLog("onSelect", onSelect);

  return (
    <section>
      <label>
        %%note%% <input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <p>
        %%sortBy%%{" "}
        {sortOptions.map((option) => (
          <button key={option} aria-pressed={sort === option} onClick={() => onSelect(option)}>
            {option}
          </button>
        ))}
      </p>
      <ul>
        {visibleTasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
