"use client";

import { useState } from "react";
import { APP_NAME, MAX_REMINDERS } from "./config";
// import { sendReminder } from "./config"; — the old call; the browser now asks our server instead.
import { requestReminder } from "./reminder-client";

export default function ReminderButton({ taskId, title }: { taskId: string; title: string }) {
  const [status, setStatus] = useState("");

  async function handleClick() {
    setStatus(await requestReminder(taskId));
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
