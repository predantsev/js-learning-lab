import { useEffect, useState } from "react";
import { subscribe } from "./feed.js";

// "Has already subscribed" flag: skips StrictMode's second setup, but nothing ever resets it.
let subscribed = false;

export default function HabitFeed() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (subscribed) return;
    subscribed = true;
    subscribe((record) => {
      setRecords((current) => [...current, record]);
    });
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
