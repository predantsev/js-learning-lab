// The bookmarks API contract: field → type, plus a pattern for the slug. Read-only.
export const bookmarkSchema = { id: 'string', title: 'string', url: 'string', slug: 'string', archived: 'boolean' };
const SLUG = /^[a-z0-9-]+$/;

// One message per broken promise, with the path: "[1].slug: expected …, got …".
export function schemaErrors(body, schema = bookmarkSchema) {
  if (!Array.isArray(body)) return ['body: expected an array'];
  const errors = [];
  body.forEach((record, i) => {
    for (const [field, type] of Object.entries(schema)) {
      const value = record?.[field];
      if (typeof value !== type) errors.push(`[${i}].${field}: expected ${type}, got ${JSON.stringify(value) ?? 'undefined'}`);
    }
    if (typeof record?.slug === 'string' && !SLUG.test(record.slug)) errors.push(`[${i}].slug: expected ${SLUG}, got ${JSON.stringify(record.slug)}`);
  });
  return errors;
}
