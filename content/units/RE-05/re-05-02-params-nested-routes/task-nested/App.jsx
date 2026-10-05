import { useEffect, useState } from "react";
import { Router, Routes, Link, Outlet, useParams, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { tasks } from "./tasks.js";

const history = createMemoryHistory("/tasks");

function TasksLayout() {
  const [clicks, setClicks] = useState(0);
  useEffect(() => {
    console.log("TasksLayout mounted");
    return () => console.log("TasksLayout unmounted");
  }, []);
  return (
    <div>
      <h1>%%planner%%</h1>
      <button onClick={() => setClicks(clicks + 1)}>%%layoutCounter%% {clicks}</button>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <Link to={`/tasks/${task.id}`}>{task.title}</Link>
          </li>
        ))}
      </ul>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function PickTask() {
  return <p>%%pick%%</p>;
}

function TaskDetail() {
  const { id } = useParams();
  const task = tasks.find((candidate) => candidate.id === id);
  if (!task) return <h2>%%noTask%% {id}</h2>;
  return (
    <section>
      <h2>{task.title}</h2>
      <p>%%due%% {task.dueDate ?? "—"}</p>
      <Link to={`/tasks/${id}/edit`}>%%edit%%</Link>
    </section>
  );
}

function TaskEdit() {
  const { id } = useParams();
  return (
    <section>
      <h2>%%editing%% {id}</h2>
      <Link to={`/tasks/${id}`}>%%done%%</Link>
    </section>
  );
}

// Nested: one TasksLayout for every /tasks address; only the inner screen swaps.
const nestedRoutes = [
  {
    path: "/tasks",
    element: <TasksLayout />,
    children: [
      { path: "", element: <PickTask /> },
      { path: ":id", element: <TaskDetail /> },
      { path: ":id/edit", element: <TaskEdit /> },
    ],
  },
];

// Not nested: three separate routes, each with its own copy of TasksLayout.
const flatRoutes = [
  { path: "/tasks", element: <TasksLayout />, children: [{ path: "", element: <PickTask /> }] },
  { path: "/tasks/:id", element: <TasksLayout />, children: [{ path: "", element: <TaskDetail /> }] },
  { path: "/tasks/:id/edit", element: <TasksLayout />, children: [{ path: "", element: <TaskEdit /> }] },
];

export default function App() {
  return (
    <Router history={history}>
      <HistoryPanel />
      <Routes routes={nestedRoutes} />
    </Router>
  );
}
