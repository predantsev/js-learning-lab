// A fake server with a 400 ms delay. The page's buttons choose how the next load ends.
export type Task = { id: string; title: string };
export type Outcome = "ok" | "empty" | "fail";

const TASKS: Task[] = [
  { id: "t-01", title: "%%plants%%" },
  { id: "t-02", title: "%%library%%" },
  { id: "t-05", title: "%%dentist%%" },
];
let nextOutcome: Outcome = "ok";

export function setNextOutcome(outcome: Outcome) {
  nextOutcome = outcome;
}

export function loadTasks(): Promise<Task[]> {
  const outcome = nextOutcome;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (outcome === "fail") reject(new Error("%%serverDown%%"));
      else resolve(outcome === "empty" ? [] : TASKS);
    }, 400);
  });
}
