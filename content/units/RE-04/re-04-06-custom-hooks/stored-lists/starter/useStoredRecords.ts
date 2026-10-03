import { useEffect, useState } from "react";
import { readRecords } from "./storage";
import type { StoredTask } from "./storage";

// TODO: write the contract of the hook here (arguments, return value, effects and their
// dependencies, cleanup, what each call owns), then move the logic from WorkList into it.
export function useStoredRecords(key: string): [StoredTask[], (next: StoredTask[]) => void] {
  throw new Error("TODO: useStoredRecords is not written yet");
}
