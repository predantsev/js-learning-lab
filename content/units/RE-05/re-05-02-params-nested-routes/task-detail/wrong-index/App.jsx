import { Router, Routes, Link, Outlet, useParams } from "./router";
import { HistoryPanel } from "./HistoryPanel";
import { history } from "./history";
import { tasks } from "./tasks.js";
import { TaskCard, TaskNotFound } from "./TaskViews";

function TasksLayout() {
  return (
    <div>
      <h1>%%planner%%</h1>
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

function TaskDetail() {
  const { id } = useParams();
  const task = tasks[id];
  if (!task) return <TaskNotFound id={id} />;
  return <TaskCard task={task} />;
}

const routes = [
  {
    path: "/tasks",
    element: <TasksLayout />,
    children: [
      { path: "", element: <p>%%pick%%</p> },
      { path: ":id", element: <TaskDetail /> },
    ],
  },
];

export default function App() {
  return (
    <Router history={history}>
      <HistoryPanel />
      <Routes routes={routes} />
    </Router>
  );
}
