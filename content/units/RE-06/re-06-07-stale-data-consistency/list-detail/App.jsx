import { useEffect, useState } from "react";
import { invalidateHabits, useHabits } from "./habitsQuery.js";

const SHARED = false; // false: the detail keeps its own copy · true: it reads the shared entry

async function saveName(id, name) {
  const response = await fetch(`/api/habits/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return response.json();
}

function HabitList({ onOpen }) {
  const habits = useHabits();
  if (habits === null) return <p>%%loading%%</p>;
  return (
    <ul>
      {habits.map((habit) => (
        <li key={habit.id}>
          <button onClick={() => onOpen(habit.id)}>{habit.name}</button>
        </li>
      ))}
    </ul>
  );
}

// The detail fetches the habit and keeps it in its own state.
function CopyDetail({ id }) {
  const [habit, setHabit] = useState(null);
  useEffect(() => {
    fetch(`/api/habits/${id}`)
      .then((response) => response.json())
      .then(setHabit);
  }, [id]);
  if (habit === null) return <p>%%loading%%</p>;
  return <NameEditor key={id} habit={habit} onSave={async (name) => setHabit(await saveName(id, name))} />;
}

// The detail reads the same cached list as HabitList and invalidates it after a save.
function SharedDetail({ id }) {
  const habits = useHabits();
  const habit = habits?.find((item) => item.id === id);
  if (habit === undefined) return <p>%%loading%%</p>;
  return (
    <NameEditor
      key={id}
      habit={habit}
      onSave={async (name) => {
        await saveName(id, name);
        invalidateHabits();
      }}
    />
  );
}

function NameEditor({ habit, onSave }) {
  const [name, setName] = useState(habit.name);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(name);
      }}
    >
      <h2>{habit.name}</h2>
      <label htmlFor="habit-name">%%nameField%%</label>
      <input id="habit-name" value={name} onChange={(event) => setName(event.target.value)} />
      <button type="submit">%%save%%</button>
    </form>
  );
}

export default function Habits() {
  const [openId, setOpenId] = useState("h-01");
  const Detail = SHARED ? SharedDetail : CopyDetail;
  return (
    <main>
      <HabitList onOpen={setOpenId} />
      <Detail id={openId} />
    </main>
  );
}
