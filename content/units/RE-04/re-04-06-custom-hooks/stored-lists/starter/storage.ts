// Reading stored tasks. Read-only.
export type StoredTask = { readonly id: string; title: string };

// The tasks stored under `key`, or [] when nothing usable is there.
export function readRecords(key: string): StoredTask[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

let nextNumber = 1;

export function nextTaskId(): string {
  const id = "t-" + String(100 + nextNumber);
  nextNumber += 1;
  return id;
}
