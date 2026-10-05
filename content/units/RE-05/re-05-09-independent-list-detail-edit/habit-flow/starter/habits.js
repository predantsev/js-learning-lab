// The habit tracker's validator: { ok: true, value } or { ok: false, errors: { field: messageKey } }.
export function validateHabit(input) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const errors = {};
  if (name.length === 0) errors.name = "nameRequired";
  else if (name.length > 80) errors.name = "nameTooLong";
  if (input.frequency !== "daily" && input.frequency !== "weekly") errors.frequency = "frequencyInvalid";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, frequency: input.frequency } };
}

export const MESSAGES = {
  nameRequired: "%%nameRequired%%",
  nameTooLong: "%%nameTooLong%%",
  frequencyInvalid: "%%frequencyInvalid%%",
};

export const FREQUENCY = { daily: "%%daily%%", weekly: "%%weekly%%" };
