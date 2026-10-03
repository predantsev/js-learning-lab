import { useEffect, useState } from "react";
import { subscribe } from "./feed.js";

export default function HabitFeed() {
  const [records, setRecords] = useState([]);

  // Show every new completion from the live feed; the cleanup ends this subscription.
  useEffect(() => {
    const unsubscribe = subscribe((record) => {
      setRecords((current) => [...current, record]);
    });
    return unsubscribe;
  }, []);

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
