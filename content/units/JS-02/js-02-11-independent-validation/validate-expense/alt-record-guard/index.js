// A missing record becomes an empty one: typeof alone would let null through, so null is excluded too.
function validate(input) {
  const errors = {};

  const record = typeof input === "object" && input !== null ? input : {};

  if (record.label === undefined || record.label === null || record.label === "") {
    errors.label = "required";
  } else if (typeof record.label !== "string") {
    errors.label = "not-text";
  }

  const amount = record.amountMinor;
  const isNumber = typeof amount === "number" && !Number.isNaN(amount);
  if (amount === undefined || amount === null) {
    errors.amountMinor = "required";
  } else if (!isNumber) {
    errors.amountMinor = "not-a-number";
  } else if (amount <= 0) {
    errors.amountMinor = "not-positive";
  } else if (amount % 1 !== 0) {
    errors.amountMinor = "not-whole";
  }

  switch (record.category) {
    case "food":
    case "transport":
    case "home":
    case "fun":
      break;
    case undefined:
    case null:
    case "":
      errors.category = "required";
      break;
    default:
      errors.category = "unknown";
  }

  const hasErrors = errors.label !== undefined || errors.amountMinor !== undefined || errors.category !== undefined;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: input };
}
