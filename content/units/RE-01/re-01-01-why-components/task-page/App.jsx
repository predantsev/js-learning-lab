import { tasks } from "./tasks.js";

function Header() {
  return <h1>%%heading%%</h1>;
}

function TaskList() {
  // One <li> per task. map: one element per record; key: explained in a later lesson.
  return <ul>{tasks.map((task) => <li key={task.id}>{task.title}</li>)}</ul>;
}

export function App() {
  return (
    <main>
      <Header />
      <TaskList />
    </main>
  );
}
