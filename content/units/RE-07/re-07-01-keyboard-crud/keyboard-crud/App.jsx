import { useEffect, useRef, useState } from "react";
import "./styles.css";

const TASKS = [
  { id: "t-01", title: "%%water%%", done: false },
  { id: "t-02", title: "%%library%%", done: false },
  { id: "t-03", title: "%%grandma%%", done: false },
  { id: "t-05", title: "%%dentist%%", done: false },
];

// Describes an element in a few words, for the console.
function describe(element) {
  if (element === document.body) return "body";
  return `${element.tagName.toLowerCase()} “${element.textContent || element.value}”`;
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState(TASKS);
  const [draft, setDraft] = useState("");
  const headingRef = useRef(null);
  const listRef = useRef(null);
  const nextId = useRef(10);

  function add(event) {
    event.preventDefault();
    const title = draft.trim();
    if (title === "") return;
    nextId.current += 1;
    setTasks([...tasks, { id: `t-${nextId.current}`, title, done: false }]);
    setDraft("");
  }

  function toggle(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function remove(id) {
    setTasks(tasks.filter((task) => task.id !== id));
  }

  // After every commit with a new list: where is the keyboard focus now?
  useEffect(() => {
    console.log(`%%focusOn%% ${describe(document.activeElement)}`);
  }, [tasks]);

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%heading%%
      </h2>
      <form onSubmit={add}>
        <label>
          %%newTask%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>{" "}
        <button type="submit">%%add%%</button>
      </form>
      <ul ref={listRef}>
        {tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input type="checkbox" checked={task.done} onChange={() => toggle(task.id)} /> {task.title}
            </label>
            <button onClick={() => remove(task.id)}>
              %%remove%% {task.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
