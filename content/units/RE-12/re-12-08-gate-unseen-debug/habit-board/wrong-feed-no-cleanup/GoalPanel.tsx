import { useState } from "react";

export default function GoalPanel() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(5);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}>
        %%goalShow%%
      </button>
    );
  }
  return (
    <div>
      <p>
        %%goalText%%: {days}
      </p>
      <button type="button" onClick={() => setDays(days + 1)}>
        +1
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        %%goalHide%%
      </button>
    </div>
  );
}
