import DayTotal from "./DayTotal";
import { SNAPSHOT } from "./snapshot";

export default function App() {
  return (
    <main>
      <h1>%%title%%</h1>
      <DayTotal expenses={SNAPSHOT.expenses} today={SNAPSHOT.today} euroToday={SNAPSHOT.euroToday} />
    </main>
  );
}
