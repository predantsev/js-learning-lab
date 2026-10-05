// A pretend request to the server that stores the flag.
export function saveAcquired(id, acquired) {
  console.log(`PATCH /api/items/${id} { acquired: ${acquired} }`);
}
