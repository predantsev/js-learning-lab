import { TaskList } from "./TaskList";

function AsWritten({ tasks }) {
  return <ol>{tasks.map((task) => <li key={task.id}>{task.title}</li>)}</ol>;
}

export function App({ tasks }) {
  return (
    <main>
      <button type="button">%%again%%</button>
      <h2>%%asWritten%%</h2>
      <AsWritten tasks={tasks} />
      <h2>%%byDue%%</h2>
      <TaskList tasks={tasks} />
    </main>
  );
}
