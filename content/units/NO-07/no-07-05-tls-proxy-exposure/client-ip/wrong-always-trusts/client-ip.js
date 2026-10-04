// Misconception: X-Forwarded-For always tells the truth, whoever sent the request.
export function clientIp(request, { trustedProxies }) {
  const peer = request.socket.remoteAddress;

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
