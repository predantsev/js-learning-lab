// clientIp(request, { trustedProxies }): the address of the client the request came from.
// X-Forwarded-For is believed only when the connection itself comes from a trusted proxy.
export function clientIp(request, { trustedProxies }) {
  const peer = request.socket.remoteAddress;
  if (!trustedProxies.includes(peer)) return peer; // a direct client: its headers prove nothing

  // Every proxy appends the address it saw, so the trustworthy part is at the right end.
  const chain = String(request.headers['x-forwarded-for'] ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    if (!trustedProxies.includes(chain[i])) return chain[i];
  }
  return peer;
}
