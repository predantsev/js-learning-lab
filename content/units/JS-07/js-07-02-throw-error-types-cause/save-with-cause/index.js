// Prints the message and the cause of every error that no code handled.
window.addEventListener("error", (event) => {
  console.log(event.error.message);
  console.log(event.error.cause);
});

// validateHabit(input) returns { ok: true, value } or { ok: false, errors }, as in JS-02.
function validateHabit(input) {
  const errors = {};
  if (typeof input.name !== "string" || input.name.trim() === "") {
    errors.name = "required";
  }
  if (input.frequency !== "daily" && input.frequency !== "weekly") {
    errors.frequency = "unknown";
  }
  const hasErrors = errors.name !== undefined || errors.frequency !== undefined;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: input };
}

function saveHabit(input) {
  const result = validateHabit(input);
  if (!result.ok) {
    throw new Error("habit cannot be saved", { cause: result.errors });
  }
  console.log("%%saved%%" + result.value.name);
}

saveHabit({ name: "%%water%%", frequency: "daily" });
saveHabit({ name: "  ", frequency: "monthly" });
