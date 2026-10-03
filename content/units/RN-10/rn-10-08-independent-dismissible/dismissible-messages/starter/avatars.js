// avatars.js: SIMULATED avatar pictures the server offers in several square sizes (generated squares,
// not real photos). Read-only.
const square = (px, color) =>
  'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><rect width="${px}" height="${px}" fill="${color}"/></svg>`);

// Smallest first; the last one is the uploaded original.
export function avatarVariants(color) {
  return [48, 96, 144, 1024].map((px) => ({ px, uri: square(px, color) }));
}
