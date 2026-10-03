import { formatMinor, toEuro } from "./money";

export default function DayTotal({ expenses }) {
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
        <small>{`≈ € ${toEuro(totalMinor)}`}</small>
      </p>
    </section>
  );
}
