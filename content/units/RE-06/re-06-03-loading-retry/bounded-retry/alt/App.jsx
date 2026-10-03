import { useEffect, useState } from "react";
import { fetchExpenses } from "./fixtureApi.js";

const MAX_ATTEMPTS = 3;

export default function ExpenseList() {
  const [expenses, setExpenses] = useState(null);
  const [pending, setPending] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await fetchExpenses({ signal: controller.signal });
        setExpenses(data);
        setFailed(false);
        setAttemptsLeft(MAX_ATTEMPTS);
        setPending(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        setFailed(true);
        setAttemptsLeft((left) => left - 1);
        setPending(false);
      }
    }
    load();
    return () => controller.abort();
  }, [round]);

  function loadAgain() {
    if (pending) return;
    setPending(true);
    setFailed(false);
    setRound((current) => current + 1);
  }

  const used = MAX_ATTEMPTS - attemptsLeft;
  let message = "";
  if (pending) message = expenses === null ? "%%loading%%" : "%%refreshing%%";
  else if (failed) message = attemptsLeft === 0 ? "%%giveUp%%" : "%%failed%%".replace("{attempt}", String(used));

  return (
    <section>
      <p role="status">{message}</p>
      <button onClick={loadAgain} disabled={pending || attemptsLeft === 0}>
        {failed ? "%%tryAgain%%" : "%%refresh%%"}
      </button>
      <ul>
        {(expenses ?? []).map((expense) => (
          <li key={expense.id}>{expense.label}</li>
        ))}
      </ul>
    </section>
  );
}
