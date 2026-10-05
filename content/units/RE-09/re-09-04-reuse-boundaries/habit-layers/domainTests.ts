// The domain's own tests. Read them; they stay unchanged.
import { completeHabit } from "./domain/habits";
import type { Habit } from "./domain/types";

const list: Habit[] = [{ id: "h-04", name: "%%tidy%%", completions: ["2026-03-01"] }];

export function runDomainTests(where: string): void {
  try {
    const next = completeHabit(list, "h-04", "2026-02-22");
    const ok = next[0].completions.join(",") === "2026-02-22,2026-03-01" && list[0].completions.length === 1;
    console.log(`${ok ? "✓" : "✗"} ${where}: completeHabit`);
  } catch (error) {
    console.log(`✗ ${where}: ${String(error)}`);
  }
}

// Runs a function as if on a platform without browser storage (React Native has no localStorage).
export function withoutBrowserStorage(run: () => void): void {
  const saved = Object.getOwnPropertyDescriptor(window, "localStorage")!;
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      throw new Error("%%noStorage%%");
    },
  });
  try {
    run();
  } finally {
    Object.defineProperty(window, "localStorage", saved);
  }
}
