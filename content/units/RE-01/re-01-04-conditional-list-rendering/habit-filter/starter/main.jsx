import { createRoot } from "react-dom/client";
import { HabitList } from "./HabitList";
import { habits } from "./habits.js";

function App() {
  return (
    <main>
      <h2>%%activeHeading%%</h2>
      <HabitList habits={habits} status="active" />
      <h2>%%pausedHeading%%</h2>
      <HabitList habits={habits} status="paused" />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
