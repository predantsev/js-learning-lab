// clientIp(request, { trustedProxies }): the address of the client the request came from.
// X-Forwarded-For is believed only when the connection itself comes from a trusted proxy.
export function clientIp(request, { trustedProxies }) {
  // TODO: decide when to read X-Forwarded-For, and which entry of it to believe.
  return request.headers['x-forwarded-for'] ?? request.socket.remoteAddress;
}
