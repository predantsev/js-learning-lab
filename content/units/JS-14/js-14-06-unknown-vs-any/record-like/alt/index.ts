function isRecordLike(value: unknown): value is Record<string, unknown> {
  if (value === null || Array.isArray(value)) {
    return false;
  }
  return typeof value === "object";
}

// Every text here is valid JSON, but not every one holds a habit.
function readHabitName(text: string): string | null {
  const value: unknown = JSON.parse(text);
  if (!isRecordLike(value)) {
    return null;
  }
  const name = value.name;
  return typeof name === "string" ? name : null;
}

console.log(readHabitName('{"id": "h-01", "name": "%%exercise%%"}'));
console.log(readHabitName("42"));
console.log(readHabitName("null"));
