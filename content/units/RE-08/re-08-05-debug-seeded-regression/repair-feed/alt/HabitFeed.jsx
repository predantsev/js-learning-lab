import { useEffect, useState } from "react";
import { subscribe } from "./feed.js";

export default function HabitFeed() {
  const [records, setRecords] = useState([]);

  // subscribe() already returns the function that ends the subscription: return it as the cleanup.
  useEffect(
    () =>
      subscribe((record) => {
        setRecords((current) => [...current, record]);
      }),
    []
  );

  return (
    <section>
      <h2>%%feedHeading%%</h2>
      {records.length === 0 ? (
        <p>%%empty%%</p>
      ) : (
        <ul>
          {records.map((record) => (
            <li key={record.id}>
              {record.habit} — {record.date}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
