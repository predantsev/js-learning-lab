// A fallback keeps the screen readable when the value is missing from .env.
export const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
