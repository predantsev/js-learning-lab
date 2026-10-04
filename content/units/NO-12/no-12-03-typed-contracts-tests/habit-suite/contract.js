// The habit API contract as data: field name → the type its value must have at run time.
// The TypeScript type HabitSummary in the client says the same, but types disappear when the code runs.
export const habitSummarySchema = { id: 'string', name: 'string', active: 'boolean', completionCount: 'number' };

// One message per broken promise, with the path of the value: "[1].completionCount: expected number, got "3"".
export function schemaErrors(body, schema) {
  const records = Array.isArray(body) ? body : [body];
  const errors = [];
  records.forEach((record, i) => {
    const prefix = Array.isArray(body) ? `[${i}].` : '';
    for (const [field, type] of Object.entries(schema)) {
      const value = record?.[field];
      if (typeof value !== type) errors.push(`${prefix}${field}: expected ${type}, got ${JSON.stringify(value) ?? 'undefined'}`);
    }
  });
  return errors;
}
