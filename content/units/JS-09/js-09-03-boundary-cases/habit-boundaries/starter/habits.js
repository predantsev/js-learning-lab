// Checks a draft habit. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateHabit(input) {
  const errors = {};

  const name = (input.name ?? "").trim();
  if (name === "") {
    errors.name = "required";
  } else if (name.length > 80) {
    errors.name = "too-long";
  }

  // The two known frequencies share one break; a missing frequency is "daily".
  const frequency = input.frequency ?? "daily";
  switch (frequency) {
    case "daily":
    case "weekly":
      break;
    default:
      errors.frequency = "unknown";
  }

  if (errors.name !== undefined || errors.frequency !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { name: name, frequency: frequency } };
}
