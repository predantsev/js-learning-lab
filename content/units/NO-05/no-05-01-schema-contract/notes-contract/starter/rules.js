// checkField(rule, value): the problem text when `value` breaks `rule`, or null when it follows it.
// A rule has `type` ('string' | 'number' | 'boolean') and may have `nullable`, `minLength`,
// `maxLength` and `min`. Missing values (undefined) are not checked here: that is parseStore's job.
export function checkField(rule, value) {
  if (value === null) return rule.nullable ? null : 'must not be null';
  if (typeof value !== rule.type) return `expected ${rule.type}, got ${typeof value}`;
  if (rule.type === 'string') {
    const length = value.trim().length;
    if (rule.minLength !== undefined && length < rule.minLength) return `shorter than ${rule.minLength}`;
    if (rule.maxLength !== undefined && length > rule.maxLength) return `longer than ${rule.maxLength}`;
  }
  if (rule.type === 'number' && (!Number.isFinite(value) || (rule.min !== undefined && value < rule.min))) {
    return `must be a number of at least ${rule.min}`;
  }
  return null;
}
