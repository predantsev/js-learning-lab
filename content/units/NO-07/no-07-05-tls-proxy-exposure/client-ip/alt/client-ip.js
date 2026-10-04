// Another valid approach: drop trusted proxies from the right end of the full chain (header + peer).
export function clientIp(request, { trustedProxies }) {
  const peer = request.socket.remoteAddress;
  if (!trustedProxies.includes(peer)) return peer;
  const header = request.headers['x-forwarded-for'];
  const hops = [...(typeof header === 'string' ? header.split(',') : []).map((part) => part.trim()).filter(Boolean), peer];
  while (hops.length > 1 && trustedProxies.includes(hops.at(-1))) hops.pop();
  return hops.at(-1);
}
