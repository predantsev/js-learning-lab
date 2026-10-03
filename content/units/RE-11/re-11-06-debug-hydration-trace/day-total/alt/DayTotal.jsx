// Formats the amount here and drops the money.js import altogether.
export default function DayTotal({ expenses, today, euroToday }) {
  let totalMinor = 0;
  for (const expense of expenses) {
    if (expense.date === today) totalMinor += expense.amountMinor;
  }

  return (
    <section>
      <h2>%%today%%</h2>
      <p>
        <strong>{`${(totalMinor / 100).toFixed(2)} %%currency%%`}</strong>
      </p>
      <p>
        <small>{`≈ € ${euroToday}`}</small>
      </p>
    </section>
  );
}
