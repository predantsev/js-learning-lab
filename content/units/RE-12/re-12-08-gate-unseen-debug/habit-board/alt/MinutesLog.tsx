import { useState, type FormEvent } from "react";

export default function MinutesLog() {
  const [total, setTotal] = useState<number>(0);
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number.parseInt(draft, 10);
    setTotal((current) => current + (Number.isNaN(minutes) ? 0 : minutes));
    setDraft("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        %%minutesLabel%% <input value={draft} onChange={(event) => setDraft(event.currentTarget.value)} />
      </label>
      <button type="submit">%%addMinutes%%</button>
      <p>
        %%minutesTotal%%: <output>{total}</output>
      </p>
    </form>
  );
}
