// redact(value, { keys }): a copy of `value` that is safe to log. The value of every property whose
// name is in `keys` (any letter case) becomes '[REDACTED]', at any depth. An Error becomes
// { name, message, cause } with its cause redacted too. The input is never changed.
export function redact(value, { keys }) {
  // TODO: walk the value and replace the secrets.
  return value;
}
