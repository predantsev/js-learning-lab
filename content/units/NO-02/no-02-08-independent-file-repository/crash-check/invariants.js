// checkInvariants(records, confirmedIds): what must hold after any crash and restart.
// Returns a list of problems; an empty list means the data survived.
export function checkInvariants(records, confirmedIds) {
  const problems = [];
  if (!Array.isArray(records)) return ['the records are not an array'];
  const seen = new Set();
  for (const record of records) {
    const whole =
      typeof record?.id === 'string' &&
      typeof record.label === 'string' && record.label.length > 0 &&
      Number.isInteger(record.amountMinor) && record.amountMinor > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
      typeof record.category === 'string';
    if (!whole) problems.push(`a half-written record: ${JSON.stringify(record)}`);
    if (seen.has(record?.id)) problems.push(`a duplicate id: ${record.id}`);
    seen.add(record?.id);
  }
  for (const id of confirmedIds) {
    if (!seen.has(id)) problems.push(`a confirmed save is lost: ${id}`);
  }
  return problems;
}
