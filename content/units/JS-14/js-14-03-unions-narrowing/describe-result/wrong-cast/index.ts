type WishInput = { name: string; price: number | null };

type ValidationResult =
  | { ok: true; value: WishInput }
  | { ok: false; errors: Record<string, string> };

function describeResult(result: ValidationResult): string {
  // tsc complained about result.value, so tell it this is a success.
  const success = result as { ok: true; value: WishInput };
  return `%%saved%%: ${success.value.name}`;
}

const results: ValidationResult[] = [
  { ok: true, value: { name: "%%lamp%%", price: 45 } },
  { ok: false, errors: { name: "required", price: "negative" } },
];

for (const result of results) {
  console.log(describeResult(result));
}
