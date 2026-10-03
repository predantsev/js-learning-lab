import { useEffect, useState } from "react";
import { subscribe } from "./feed.js";

export default function HabitFeed() {
  const [records, setRecords] = useState([]);

  // The cleanup only returns the unsubscribe function and never calls it: the subscription stays.
  useEffect(() => {
    const unsubscribe = subscribe((record) => {
      setRecords((current) => [...current, record]);
    });
    return () => unsubscribe;
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
