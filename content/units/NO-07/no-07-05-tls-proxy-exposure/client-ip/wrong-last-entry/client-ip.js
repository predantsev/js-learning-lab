// Misconception: the last entry is always the client, because only one proxy stands in front of the server.
export function clientIp(request, { trustedProxies }) {
  const peer = request.socket.remoteAddress;
  if (!trustedProxies.includes(peer)) return peer; // a direct client: its headers prove nothing

  // Every proxy appends the address it saw, so the trustworthy part is at the right end.
  const chain = String(request.headers['x-forwarded-for'] ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
  return chain.at(-1) ?? peer;
}
