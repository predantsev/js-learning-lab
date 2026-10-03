// The address of the expenses server. The bundler writes the value in at build time,
// so the name carries the EXPO_PUBLIC_ prefix and is written with a dot.
export const apiUrl = process.env.EXPO_PUBLIC_API_URL;
