// The empty-label check uses ==, and 0 == "" is true: a numeric label is called "required".
function validate(input) {
  const errors = {};

  const label = input?.label;
  if (label == null || label == "") {
    errors.label = "required";
  } else if (typeof label !== "string") {
    errors.label = "not-text";
  }

  const amount = input?.amountMinor;
  if (amount == null) {
    errors.amountMinor = "required";
  } else if (typeof amount !== "number" || Number.isNaN(amount)) {
    errors.amountMinor = "not-a-number";
  } else if (amount <= 0) {
    errors.amountMinor = "not-positive";
  } else if (amount % 1 !== 0) {
    errors.amountMinor = "not-whole";
  }

  const category = input?.category;
  switch (category) {
    case "food":
    case "transport":
    case "home":
    case "fun":
      break;
    case null:
    case undefined:
    case "":
      errors.category = "required";
      break;
    default:
      errors.category = "unknown";
  }

  const hasErrors = errors.label !== undefined || errors.amountMinor !== undefined || errors.category !== undefined;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: input };
}
