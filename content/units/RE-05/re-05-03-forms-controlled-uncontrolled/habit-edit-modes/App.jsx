import { useState } from "react";
import { Router, Routes, Link, Outlet, useParams, createMemoryHistory } from "./router";
import { habits } from "./habits.js";

const history = createMemoryHistory("/habits/h-01/edit");

function HabitsLayout() {
  return (
    <div>
      <h1>%%habits%%</h1>
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            <Link to={`/habits/${habit.id}/edit`}>{habit.name}</Link>
          </li>
        ))}
      </ul>
      <Outlet />
      <NewHabitForm />
    </div>
  );
}

// Uncontrolled: the field keeps its own value; the code reads it once, on submit.
function HabitEdit() {
  const { id } = useParams();
  const habit = habits.find((candidate) => candidate.id === id);
  if (habit === undefined) return <p>%%notFound%%</p>;

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log("%%saving%%", data.get("name"));
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>%%editing%% {id}</h2>
      <label htmlFor="habit-name">%%name%%</label> <input id="habit-name" name="name" defaultValue={habit.name} />{" "}
      <button>%%save%%</button>
    </form>
  );
}

// Controlled: state holds the value, so the preview can follow every keystroke.
function NewHabitForm() {
  const [draft, setDraft] = useState({});
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        console.log("%%adding%%", draft.name);
      }}
    >
      <h2>%%newHabit%%</h2>
      <label htmlFor="new-name">%%name%%</label>{" "}
      <input id="new-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />{" "}
      <button>%%add%%</button>
      <p>%%preview%% {draft.name}</p>
    </form>
  );
}

const routes = [
  {
    path: "/habits",
    element: <HabitsLayout />,
    children: [{ path: ":id/edit", element: <HabitEdit /> }],
  },
];

export default function App() {
  return (
    <Router history={history}>
      <Routes routes={routes} />
    </Router>
  );
}
