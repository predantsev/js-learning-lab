import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";

type Frequency = "daily" | "weekly";
type HabitDraft = { name: string; frequency: Frequency };

export default function HabitForm() {
  const [draft, setDraft] = useState<HabitDraft>({ name: "", frequency: "daily" });
  console.log("render:", JSON.stringify(draft));

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft({ ...draft, name: event.target.value });
  }

  function handleFrequencyChange(event: ChangeEvent<HTMLSelectElement>) {
    setDraft({ ...draft, frequency: event.target.value as Frequency });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("submit:", draft.name, draft.frequency);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>%%title%%</h1>
      <label>
        %%nameLabel%% <input value={draft.name} onChange={handleNameChange} />
      </label>
      <label>
        %%frequencyLabel%%{" "}
        <select value={draft.frequency} onChange={handleFrequencyChange}>
          <option value="daily">%%daily%%</option>
          <option value="weekly">%%weekly%%</option>
        </select>
      </label>
      <button>%%save%%</button>
    </form>
  );
}
