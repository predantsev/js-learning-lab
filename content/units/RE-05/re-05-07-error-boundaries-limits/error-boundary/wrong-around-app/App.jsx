import { useState } from "react";
import { Router, Routes, Link, Outlet, useLocation, createMemoryHistory } from "./router";
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

const routes = [
  {
    path: "/habits",
    element: <HabitsLayout />,
    children: [
      { path: "", element: <p>%%pick%%</p> },
      { path: ":id", element: <HabitDetail /> },
    ],
  },
];

export default function App() {
  const [history] = useState(() => createMemoryHistory("/habits"));
  return (
    <ErrorBoundary>
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </ErrorBoundary>
  );
}
