import { useEffect, useState } from "react";
import { fetchHabits } from "./fixtureApi.js";

export default function HabitList() {
  const [habits, setHabits] = useState(null); // null: nothing has loaded yet
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "failed"
  const [round, setRound] = useState(0); // every new value loads the list again

  useEffect(() => {
    const controller = new AbortController();
    fetchHabits({ signal: controller.signal })
      .then((data) => {
        setHabits(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("failed");
      });
    return () => controller.abort();
  }, [round]);

  function loadAgain() {
    setStatus("loading");
    setRound((current) => current + 1);
  }

  let message = "";
  if (status === "loading") message = habits === null ? "%%loading%%" : "%%refreshing%%";
  if (status === "failed") message = habits === null ? "%%loadFailed%%" : "%%refreshFailed%%";

  return (
    <section>
      <p role="status">{message}</p>
      {status === "failed" && <button onClick={loadAgain}>%%tryAgain%%</button>}
      {status === "ready" && <button onClick={loadAgain}>%%refresh%%</button>}
      {habits !== null && (
        <ul>
          {habits.map((habit) => (
            <li key={habit.id}>{habit.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
