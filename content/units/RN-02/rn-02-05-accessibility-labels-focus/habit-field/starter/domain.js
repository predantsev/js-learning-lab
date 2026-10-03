// The shared domain validation (read-only): the same function the web client uses.
export function validateHabit(input) {
  const name = input.name.trim();
  if (name.length === 0) return { ok: false, errors: { name: 'nameRequired' } };
  if (name.length > 80) return { ok: false, errors: { name: 'nameTooLong' } };
  return { ok: true, value: { name, frequency: input.frequency } };
}
