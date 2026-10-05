// The invariant of a habit's completions: "YYYY-MM-DD" dates, sorted ascending, no repeats.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
function assertInvariant(completions) {
  for (let i = 0; i < completions.length; i++) {
    if (!DATE.test(completions[i])) {
      throw new Error(`%%notDate%% ${completions[i]}`);
    }
    if (i > 0 && completions[i - 1] === completions[i]) {
      throw new Error(`%%repeated%% ${completions[i]}`);
    }
    if (i > 0 && completions[i - 1] > completions[i]) {
      throw new Error(`%%outOfOrder%% ${completions[i - 1]} → ${completions[i]}`);
    }
  }
}

// The seeded implementation: it keeps dates unique, but adds a new one at the end.
function addCompletion(completions, date) {
  if (completions.includes(date)) {
    return completions;
  }
  return [...completions, date];
}

function removeCompletion(completions, date) {
  return completions.filter((day) => day !== date);
}

const fixture = ["2026-02-27", "2026-02-28", "2026-03-01"];
const thousandDays = [];
for (let i = 0; i < 1000; i++) {
  thousandDays.push(new Date(Date.UTC(2023, 0, 1) + i * 86400000).toISOString().slice(0, 10));
}

const operations = [
  ["%%opDuplicate%%", () => addCompletion(fixture, "2026-02-28")],
  ["%%opOlder%%", () => addCompletion(fixture, "2026-02-20")],
  ["%%opRemoveMissing%%", () => removeCompletion(fixture, "2026-01-01")],
  ["%%opEmpty%%", () => addCompletion([], "2026-03-01")],
  ["%%opThousand%%", () => thousandDays.reduce(addCompletion, [])],
];

for (const [label, run] of operations) {
  const result = run();
  try {
    assertInvariant(result);
    console.log("✓", label, `(${result.length})`);
  } catch (error) {
    console.log("✗", label, "—", error.message);
  }
}
