import { formatMinor } from "./money";

// Uses the day the server rendered for and the euro amount it computed with the key.
export default function DayTotal({ expenses, today, euroToday }) {
  const totalMinor = expenses
    .filter((expense) => expense.date === today)
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
