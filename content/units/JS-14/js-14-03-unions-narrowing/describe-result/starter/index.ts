type WishInput = { name: string; price: number | null };

type ValidationResult =
  | { ok: true; value: WishInput }
  | { ok: false; errors: Record<string, string> };

function describeResult(result: ValidationResult): string {
  // TODO: for a successful result: "%%saved%%: <name>"
  //       for a failed one: "%%fix%%: <field names joined with ", ">"
  return "";
}

const results: ValidationResult[] = [
  { ok: true, value: { name: "%%lamp%%", price: 45 } },
  { ok: false, errors: { name: "required", price: "negative" } },
];

for (const result of results) {
  console.log(describeResult(result));
}
