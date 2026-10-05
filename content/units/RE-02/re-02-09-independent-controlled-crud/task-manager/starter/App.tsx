import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { validateTask, MESSAGES, startTasks, nextTaskId } from "./tasks";
import type { Task, TaskErrors, Priority } from "./tasks";

// Build the task manager here. The task description lists everything it has to do.
export default function App() {
  return (
    <main>
      <h1>%%planner%%</h1>
    </main>
  );
}
