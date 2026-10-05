import { useState } from "react";

const habits = [
  { id: "h-01", name: "%%exercise%%", frequency: "daily" },
  { id: "h-04", name: "%%tidy%%", frequency: "weekly" },
  { id: "h-06", name: "%%walk%%", frequency: "daily" },
];

function EditForm({ habit }) {
  // The initial value is used only when this EditForm appears for the first time.
  const [name, setName] = useState(habit.name);
  console.log("EditForm render: habit =", habit.id, "name =", name);

  return (
    <section>
      <h2>%%editing%%: {habit.name}</h2>
      <label>
        %%nameLabel%% <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
    </section>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState("h-01");
  const selected = habits.find((habit) => habit.id === selectedId);

  return (
    <main>
      <h1>%%title%%</h1>
      {habits.map((habit) => (
        <button key={habit.id} onClick={() => setSelectedId(habit.id)}>
          {habit.name}
        </button>
      ))}
      <EditForm habit={selected} />
    </main>
  );
}
