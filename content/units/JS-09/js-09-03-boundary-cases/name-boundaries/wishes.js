// A wish name is valid when it has 1 to 80 characters after trimming the spaces around it.
export function validateName(name) {
  const trimmed = name.trim();
  if (trimmed === "") return { ok: false, error: "required" };
  if (trimmed.length > 80) return { ok: false, error: "too-long" };
  return { ok: true, value: trimmed };
}
