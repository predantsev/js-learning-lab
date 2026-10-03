// config.ts: what the notes lab ships inside its package. All values are synthetic.
// The upload secret lives only on the server; the app gets a short-lived token after sign-in.
export const config = {
  EXPO_PUBLIC_NOTES_API: 'https://notes.jsll.example/api',
  EXPO_PUBLIC_CLIENT_ID: 'jsll-notes-lab',
};
