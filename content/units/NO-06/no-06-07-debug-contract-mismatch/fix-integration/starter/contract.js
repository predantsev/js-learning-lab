// The shared wishlist contract, v1 (read-only): one message per broken promise, [] when the wish is valid.
export function parseWishV1(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return ['wish: expected an object'];
  const errors = [];
  if (typeof value.id !== 'string' || value.id === '') errors.push('id: expected a non-empty string');
  if (typeof value.name !== 'string') errors.push('name: expected a string');
  if (value.price !== null && typeof value.price !== 'number') errors.push('price: expected number or null');
  if (typeof value.acquired !== 'boolean') errors.push('acquired: expected boolean');
  return errors;
}
