"use client";

import { useState } from "react";
import { APP_NAME, MAX_REMINDERS } from "./public-config";
import { sendReminder } from "./config";

export default function ReminderButton({ taskId, title }: { taskId: string; title: string }) {
  const [status, setStatus] = useState("");

  async function handleClick() {
    setStatus(await sendReminder(taskId));
  }

  return (
    <section>
      <h1>{APP_NAME}</h1>
      <p>{`%%limit%% ${MAX_REMINDERS}`}</p>
      <p>
        {title}{" "}
        <button onClick={handleClick}>%%remind%%</button> <output>{status}</output>
      </p>
    </section>
  );
}
