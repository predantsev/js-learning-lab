import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Router, Routes, Link, Outlet, useParams, useNavigate, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard.js";
import { INITIAL_HABITS } from "./habits.js";

const HabitsContext = createContext(null);

function HabitsLayout() {
  const { habits } = useContext(HabitsContext);
  return (
    <div>
      <HistoryPanel />
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>
            <Link to={`/habits/${habit.id}`}>{habit.name}</Link>
          </li>
        ))}
      </ul>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function HabitDetail() {
  const { id } = useParams();
  const { habits } = useContext(HabitsContext);
  const habit = habits.find((candidate) => candidate.id === id);
  if (habit === undefined) return <h1>%%notFound%%</h1>;
  return (
    <section>
      <h1>{habit.name}</h1>
      <Link to={`/habits/${id}/edit`}>%%edit%%</Link>
    </section>
  );
}

function HabitEditRoute() {
  const { id } = useParams();
  return <HabitEdit key={id} id={id} />;
}

function HabitEdit({ id }) {
  const { habits, setHabits } = useContext(HabitsContext);
  const navigate = useNavigate();
  const saved = habits.find((candidate) => candidate.id === id);
  const [name, setName] = useState(saved.name);
  const guard = useUnsavedChangesGuard(name !== saved.name);

  function handleSubmit(event) {
    event.preventDefault();
    setHabits(habits.map((habit) => (habit.id === id ? { ...habit, name } : habit)));
    navigate(`/habits/${id}`, { replace: true, skipGuard: true });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>%%editing%%</h1>
      <label htmlFor="habit-name">%%name%%</label>{" "}
      <input id="habit-name" value={name} onChange={(event) => setName(event.target.value)} /> <button>%%save%%</button>
      {guard.blocked && <LeaveDialog onStay={guard.stay} onLeave={guard.proceed} />}
    </form>
  );
}

function LeaveDialog({ onStay, onLeave }) {
  const stayRef = useRef(null);
  useEffect(() => stayRef.current.focus(), []);
  return (
    <div role="alertdialog" aria-labelledby="leave-text">
      <p id="leave-text">%%unsaved%%</p>
      <button type="button" ref={stayRef} onClick={onStay}>
        %%stay%%
      </button>{" "}
      <button type="button" onClick={onLeave}>
        %%leave%%
      </button>
    </div>
  );
}

const routes = [
  {
    path: "/habits",
    element: <HabitsLayout />,
    children: [
      { path: "", element: <h1>%%habits%%</h1> },
      { path: ":id", element: <HabitDetail /> },
      { path: ":id/edit", element: <HabitEditRoute /> },
    ],
  },
];

export default function App() {
  const [habits, setHabits] = useState(INITIAL_HABITS);
  const [history] = useState(() => createMemoryHistory("/habits"));
  return (
    <HabitsContext.Provider value={{ habits, setHabits }}>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </HabitsContext.Provider>
  );
}
