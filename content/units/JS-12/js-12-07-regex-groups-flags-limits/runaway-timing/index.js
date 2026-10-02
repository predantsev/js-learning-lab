// Two patterns for "words separated by single spaces".
const nestedPattern = /^(\w+\s?)+$/;   // a quantifier inside a group with a quantifier
const flatPattern = /^\w+(\s\w+)*$/;   // the same rule without the nesting

// Text that almost matches: a run of letters with "!" at the end.
for (const length of [16, 18, 20, 22, 24]) {
  const almost = "a".repeat(length) + "!";
  const started = performance.now();
  const result = nestedPattern.test(almost);
  const ms = performance.now() - started;
  console.log("%%nested%%", length, result, ms.toFixed(1), "ms");
}

const started = performance.now();
const result = flatPattern.test("a".repeat(24) + "!");
console.log("%%flat%%", 24, result, (performance.now() - started).toFixed(1), "ms");
