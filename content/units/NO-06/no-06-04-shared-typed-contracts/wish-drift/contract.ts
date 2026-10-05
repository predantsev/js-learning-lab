// The shared contract of the wishlist API. The server, the web client and the native companion import
// this one file: the types are for tsc, parseWishV1/parseWishV2 check the same promise at runtime.

export type WishV1 = { id: string; name: string; price: number | null; acquired: boolean };
export type WishV2 = { id: string; name: string; priceUah: number | null; acquired: boolean };

// One message per broken promise, for example "price: expected number or null". Extra fields are fine.
function errorsOf(value: unknown, fields: Record<string, (field: unknown) => boolean>): string[] {
  if (typeof value !== 'object' || value === null) return ['body: expected an object'];
  const record = value as Record<string, unknown>;
  return Object.entries(fields)
    .filter(([name, ok]) => !ok(record[name]))
    .map(([name]) => `${name}: ${DESCRIPTIONS[name]}`);
}
const DESCRIPTIONS: Record<string, string> = {
  id: 'expected a non-empty string',
  name: 'expected a string',
  price: 'expected number or null',
  priceUah: 'expected number or null',
  acquired: 'expected boolean',
};
const text = (value: unknown) => typeof value === 'string';
const amount = (value: unknown) => value === null || typeof value === 'number';
const flag = (value: unknown) => typeof value === 'boolean';
const id = (value: unknown) => typeof value === 'string' && value !== '';

export const parseWishV1 = (value: unknown): string[] => errorsOf(value, { id, name: text, price: amount, acquired: flag });
export const parseWishV2 = (value: unknown): string[] => errorsOf(value, { id, name: text, priceUah: amount, acquired: flag });
