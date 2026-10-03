import { useState } from "react";
import { Router, Routes, Link, Outlet, useParams, createMemoryHistory } from "./router";
import { ErrorBoundary } from "./ErrorBoundary";
import { HabitDetail } from "./HabitDetail";
import { habits } from "./habits.js";

function HabitsLayout() {
  return (
    <div>
      <h1>%%habits%%</h1>
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

// One boundary per record: a new id is a new boundary with no error in it.
function GuardedDetail() {
  const { id } = useParams();
  return (
    <ErrorBoundary key={id}>
      <HabitDetail />
    </ErrorBoundary>
  );
}

const routes = [
  {
    path: "/habits",
    element: <HabitsLayout />,
    children: [
      { path: "", element: <p>%%pick%%</p> },
      { path: ":id", element: <GuardedDetail /> },
    ],
  },
];

export default function App() {
  const [history] = useState(() => createMemoryHistory("/habits"));
  return (
    <Router history={history}>
      <Routes routes={routes} />
    </Router>
  );
}
