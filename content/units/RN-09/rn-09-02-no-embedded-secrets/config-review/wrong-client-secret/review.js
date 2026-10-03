// review.js: treats the client secret as public because it is compiled into the app.
// kind:    'public-identifier' | 'runtime-token' | 'server-secret'
// livesIn: 'app-config' | 'secure-storage' | 'server'
// reason:  one sentence in your own words — why this kind, and why there
export const review = {
  authIssuer: { kind: 'public-identifier', livesIn: 'app-config', reason: 'An address every copy of the app opens; knowing it grants nothing.' },
  clientId: { kind: 'public-identifier', livesIn: 'app-config', reason: 'It only names the app; the server documents it as public.' },
  clientSecret: { kind: 'public-identifier', livesIn: 'app-config', reason: 'It proves the request comes from our backend, so a copy in the app would let anyone pretend to be it.' },
  photoUploadUrl: { kind: 'public-identifier', livesIn: 'app-config', reason: 'An address; the token, not the address, decides who may upload.' },
  accessToken: { kind: 'runtime-token', livesIn: 'secure-storage', reason: 'It arrives after sign-in, belongs to one person and must survive a restart, so it goes into secure storage.' },
  refreshToken: { kind: 'runtime-token', livesIn: 'secure-storage', reason: 'Issued to one person at runtime; it mints new access tokens, so it must never sit in plain storage.' },
  pushServerKey: { kind: 'server-secret', livesIn: 'server', reason: 'Whoever holds it can message every user, so only our server may have it.' },
  webhookSigningSecret: { kind: 'server-secret', livesIn: 'server', reason: 'It lets the holder forge callbacks to our server, so it stays in the server environment.' },
};
