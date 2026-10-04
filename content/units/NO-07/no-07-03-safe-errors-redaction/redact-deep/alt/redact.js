// Another valid approach: let JSON.stringify walk the value. Its replacer sees every key and value,
// turns errors into plain objects and replaces the secrets; JSON.parse gives back a fresh copy.
export function redact(value, { keys }) {
  const secret = keys.map((key) => key.toLowerCase());
  const replacer = (key, current) => {
    if (secret.includes(key.toLowerCase())) return '[REDACTED]';
    if (current instanceof Error) {
      const plain = { name: current.name, message: current.message };
      if (current.cause !== undefined) plain.cause = current.cause;
      return plain;
    }
    return current;
  };
  const text = JSON.stringify(value, replacer);
  return text === undefined ? undefined : JSON.parse(text);
}
