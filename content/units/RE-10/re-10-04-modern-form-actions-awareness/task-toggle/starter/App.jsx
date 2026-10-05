import { TaskToggle } from "./TaskToggle";

const tasks = [
  { id: "t-02", title: "%%library%%", done: false },
  { id: "t-04", title: "%%internet%%", done: true },
];

export default function App() {
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskToggle task={task} />
        </li>
      ))}
    </ul>
  );
}
