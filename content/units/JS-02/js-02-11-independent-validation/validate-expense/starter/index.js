// validate(input) checks one expense and returns the result.
// The checker calls it many times, with a different input each time.
// Keep the first line and the last two lines of the function as they are.
function validate(input) {
  const errors = {};

  // Write your checks here. Record each problem like this:
  //   errors.label = "required";

  const hasErrors = errors.label !== undefined || errors.amountMinor !== undefined || errors.category !== undefined;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: input };
}
