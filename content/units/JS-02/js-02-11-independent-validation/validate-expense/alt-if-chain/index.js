// An early check for a missing record, === everywhere and an if chain for the category list.
function validate(input) {
  const errors = {};

  if (input === null || input === undefined) {
    errors.label = "required";
    errors.amountMinor = "required";
    errors.category = "required";
  } else {
    const label = input.label;
    if (label === null || label === undefined || label === "") {
      errors.label = "required";
    } else if (typeof label !== "string") {
      errors.label = "not-text";
    }

    const amount = input.amountMinor;
    if (amount === null || amount === undefined) {
      errors.amountMinor = "required";
    } else if (typeof amount !== "number") {
      errors.amountMinor = "not-a-number";
    } else if (Number.isNaN(amount)) {
      errors.amountMinor = "not-a-number";
    } else if (amount <= 0) {
      errors.amountMinor = "not-positive";
    } else if (amount % 1 !== 0) {
      errors.amountMinor = "not-whole";
    }

    const category = input.category;
    if (category === null || category === undefined || category === "") {
      errors.category = "required";
    } else if (category !== "food" && category !== "transport" && category !== "home" && category !== "fun") {
      errors.category = "unknown";
    }
  }

  const hasErrors = errors.label !== undefined || errors.amountMinor !== undefined || errors.category !== undefined;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: input };
}
