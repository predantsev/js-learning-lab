// TODO: true only for a plain object: not null, not an array, not a primitive.
function isRecordLike(value: unknown): value is Record<string, unknown> {
  return true;
}

// Every text here is valid JSON, but not every one holds a habit.
function readHabitName(text: string): string | null {
  const value: any = JSON.parse(text);
  // TODO: make value unknown and check it with isRecordLike before reading name;
  // return the name only when it is a string, otherwise null.
  return value.name;
}

console.log(readHabitName('{"id": "h-01", "name": "%%exercise%%"}'));
console.log(readHabitName("42"));
console.log(readHabitName("null"));
