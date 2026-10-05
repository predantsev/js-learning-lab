// Formats the total with the locale it is given; the server and the browser must pass the same one.
export default function ExpenseTotal({ totalMinor, locale }) {
  const total = (totalMinor / 100).toLocaleString(locale, { style: "currency", currency: "UAH" });
  return (
    <p>
      %%totalLabel%%: <strong>{total}</strong>
    </p>
  );
}
