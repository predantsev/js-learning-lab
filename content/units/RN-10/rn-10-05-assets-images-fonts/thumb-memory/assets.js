// assets.js: SIMULATED image sizes the server offers for every wish picture, plus the original photo,
// and a simulated font loader. Read-only. The pictures are generated squares, not real photos.
import { useEffect, useState } from 'react';

const square = (px, color) =>
  'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><rect width="${px}" height="${px}" fill="${color}"/></svg>`);

// Widths in pixels; every variant is square.
export function variantsFor(color) {
  return [
    { px: 64, uri: square(64, color) },
    { px: 128, uri: square(128, color) },
    { px: 192, uri: square(192, color) },
    { px: 4000, uri: square(4000, color) }, // the original photo
  ];
}

// Decoded size in bytes: every pixel takes 4 bytes (red, green, blue, alpha).
export const decodedBytes = (px) => px * px * 4;

// Stands in for useFonts() from expo-font: [loaded, error]. The "font file" arrives after `delayMs`.
export function useSimulatedFonts(delayMs) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);
  return [loaded, null];
}
