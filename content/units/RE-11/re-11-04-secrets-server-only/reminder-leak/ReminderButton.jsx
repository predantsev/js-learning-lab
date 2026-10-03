"use client";

import { useState } from "react";
import { remindAbout } from "./task-utils";

export default function ReminderButton({ taskId, title }) {
  const [status, setStatus] = useState("");

  async function handleClick() {
    setStatus(await remindAbout(taskId));
  }

  return (
    <p>
      {title}{" "}
      <button onClick={handleClick}>%%remind%%</button> <output>{status}</output>
    </p>
  );
}
