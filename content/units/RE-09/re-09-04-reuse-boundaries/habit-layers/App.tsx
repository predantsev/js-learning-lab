import { useHabits } from "./data/useHabits";

const TODAY = "2026-03-02";

export default function App() {
  const { habits, complete } = useHabits();
  return (
    <ul>
      {habits.map((habit) => (
        <li key={habit.id}>
          {habit.name}: {habit.completions.length}{" "}
          <button onClick={() => complete(habit.id, TODAY)}>%%doneToday%%</button>
        </li>
      ))}
    </ul>
  );
}
