import { useEffect, useState } from "react";
import { fetchExpenses } from "./fixtureApi.js";

const MAX_ATTEMPTS = 3;

export default function ExpenseList() {
  const [expenses, setExpenses] = useState(null); // null: nothing has loaded yet
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "failed"
  const [round, setRound] = useState(0); // every new value loads the list again
  const [failures, setFailures] = useState(0); // failed attempts in a row

  useEffect(() => {
    const controller = new AbortController();
    fetchExpenses({ signal: controller.signal })
      .then((data) => {
        setExpenses(data);
        setFailures(0);
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setFailures((current) => current + 1);
        setStatus("failed");
      });
    return () => controller.abort();
  }, [round]);

  function loadAgain() {
    setStatus("loading");
    setRound((current) => current + 1);
  }

  const pending = status === "loading";
  const gaveUp = failures >= MAX_ATTEMPTS;

  let message = "";
  if (pending) message = expenses === null ? "%%loading%%" : "%%refreshing%%";
  if (status === "failed") message = gaveUp ? "%%giveUp%%" : "%%failed%%".replace("{attempt}", String(failures));

  return (
    <section>
      <p role="status">{message}</p>
      <button onClick={loadAgain} disabled={gaveUp}>
        {status === "failed" ? "%%tryAgain%%" : "%%refresh%%"}
      </button>
      {expenses !== null && (
        <ul>
          {expenses.map((expense) => (
            <li key={expense.id}>{expense.label}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
