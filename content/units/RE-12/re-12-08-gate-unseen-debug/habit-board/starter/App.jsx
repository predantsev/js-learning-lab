import CompletionFeed from "./CompletionFeed";
import GoalPanel from "./GoalPanel";
import HabitSearch from "./HabitSearch";
import MinutesLog from "./MinutesLog";
import { searchLab } from "./searchLab.js";

export default function App() {
  return (
    <main>
      <h1>%%appTitle%%</h1>
      <HabitSearch search={searchLab} />
      <MinutesLog />
      <GoalPanel />
      <CompletionFeed />
    </main>
  );
}
