function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Every text here is valid JSON, but not every one holds a habit.
function readHabitName(text: string): string | null {
  const value: any = JSON.parse(text);
  return value?.name ?? null;
}

console.log(readHabitName('{"id": "h-01", "name": "%%exercise%%"}'));
console.log(readHabitName("42"));
console.log(readHabitName("null"));
