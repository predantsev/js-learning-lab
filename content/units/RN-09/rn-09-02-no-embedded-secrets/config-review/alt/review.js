// review.js: the same note, with the place derived from the kind so the two can never disagree.
const PLACE = { 'public-identifier': 'app-config', 'runtime-token': 'secure-storage', 'server-secret': 'server' };
const note = (kind, reason) => ({ kind, livesIn: PLACE[kind], reason });

export const review = {
  authIssuer: note('public-identifier', 'Just the sign-in address; it opens for everyone.'),
  clientId: note('public-identifier', 'Names the app and is public by design.'),
  photoUploadUrl: note('public-identifier', 'Just the upload address; tokens decide access.'),
  accessToken: note('runtime-token', 'Per-person, short-lived, obtained after sign-in.'),
  refreshToken: note('runtime-token', 'Per-person, obtained after sign-in, mints access tokens.'),
  clientSecret: note('server-secret', 'Confidential by its documentation; only our backend may prove it is our backend.'),
  pushServerKey: note('server-secret', 'Can reach every user, so it must never ship.'),
  webhookSigningSecret: note('server-secret', 'Can forge callbacks to our server.'),
};
