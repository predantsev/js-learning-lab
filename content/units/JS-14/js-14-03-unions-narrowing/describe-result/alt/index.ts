type WishInput = { name: string; price: number | null };

type ValidationResult =
  | { ok: true; value: WishInput }
  | { ok: false; errors: Record<string, string> };

function describeResult(result: ValidationResult): string {
  if ("errors" in result) {
    const fields = Object.keys(result.errors);
    return "%%fix%%: " + fields.join(", ");
  }
  return "%%saved%%: " + result.value.name;
}

const results: ValidationResult[] = [
  { ok: true, value: { name: "%%lamp%%", price: 45 } },
  { ok: false, errors: { name: "required", price: "negative" } },
];

for (const result of results) {
  console.log(describeResult(result));
}
