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
  // TODO: read the id param, find the task with that id,
  // show <TaskCard task={…} /> or, if there is none, <TaskNotFound id={…} />
  return null;
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
