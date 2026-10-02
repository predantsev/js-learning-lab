type WishInput = { name: string; price: number | null };

type ValidationResult =
  | { ok: true; value: WishInput }
  | { ok: false; errors: Record<string, string> };

function describeResult(result: ValidationResult): string {
  // Both fields are part of the type, so read both first.
  const name = result.value.name;
  const fields = Object.keys(result.errors);
  if (result.ok) {
    return `%%saved%%: ${name}`;
  }
  return `%%fix%%: ${fields.join(", ")}`;
}

const results: ValidationResult[] = [
  { ok: true, value: { name: "%%lamp%%", price: 45 } },
  { ok: false, errors: { name: "required", price: "negative" } },
];

for (const result of results) {
  console.log(describeResult(result));
}
