import { formatMinor } from "./money";

// Fixed the leak, kept the browser's clock — the first render still differs from the server.
export default function DayTotal({ expenses, euroToday }) {
  const today = new Date().toISOString().slice(0, 10);
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
