// Misconception: the first entry of X-Forwarded-For is the original client, so it is the one to believe.
export function clientIp(request, { trustedProxies }) {
  const peer = request.socket.remoteAddress;
  if (!trustedProxies.includes(peer)) return peer; // a direct client: its headers prove nothing

  // Every proxy appends the address it saw, so the trustworthy part is at the right end.
  const chain = String(request.headers['x-forwarded-for'] ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
  return chain[0] ?? peer;
}
