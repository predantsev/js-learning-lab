import { formatMinor, toEuro } from "./money";

// Fixed the day, kept converting in the browser — the key still travels with money.js.
export default function DayTotal({ expenses, today }) {
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
        <small>{`≈ € ${toEuro(totalMinor)}`}</small>
      </p>
    </section>
  );
}
