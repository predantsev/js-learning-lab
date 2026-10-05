import { useEffect, useState } from "react";
import { formatMinor } from "./money";

// "Browser-only values go into an effect" — but the browser's clock is the wrong day:
// hydration is clean, and right after it the total jumps to the browser's today.
export default function DayTotal({ expenses, today, euroToday }) {
  const [day, setDay] = useState(today);
  useEffect(() => {
    setDay(new Date().toISOString().slice(0, 10));
  }, []);
  const totalMinor = expenses
    .filter((expense) => expense.date === day)
    .reduce((sum, expense) => sum + expense.amountMinor, 0);

  return (
    <section>
      <h2>%%today%%</h2>
      <p>
        <strong>{formatMinor(totalMinor)}</strong>
      </p>
      <p>
        <small>{`≈ € ${euroToday}`}</small>
      </p>
    </section>
  );
}
