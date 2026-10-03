import { useEffect, useState } from "react";
import { fetchExpenses } from "./fixtureApi.js";

const MAX_ATTEMPTS = 3;

export default function ExpenseList() {
  const [expenses, setExpenses] = useState(null); // null: nothing has loaded yet
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "failed"
  const [round, setRound] = useState(0); // every new value loads the list again

  useEffect(() => {
    const controller = new AbortController();
    fetchExpenses({ signal: controller.signal })
      .then((data) => {
        setExpenses(data);
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
  if (status === "loading") message = expenses === null ? "%%loading%%" : "%%refreshing%%";
  if (status === "failed") message = "%%failed%%".replace("{attempt}", "1");

  // TODO: count failed attempts, keep the list visible after a failure,
  // disable the button while a request is pending and stop after MAX_ATTEMPTS failures.
  if (status === "failed") {
    return <p role="status">{message}</p>;
  }

  return (
    <section>
      <p role="status">{message}</p>
      <button onClick={loadAgain}>{status === "failed" ? "%%tryAgain%%" : "%%refresh%%"}</button>
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
