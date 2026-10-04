// Prints clientIp for a few synthetic requests (read-only; Check tries more).
// The addresses come from ranges reserved for documentation (192.0.2.x, 198.51.100.x, 203.0.113.x) and a private network (10.x).
import { clientIp } from './client-ip.js';

const fake = (peer, forwardedFor) => ({ socket: { remoteAddress: peer }, headers: forwardedFor === undefined ? {} : { 'x-forwarded-for': forwardedFor } });
const options = { trustedProxies: ['10.0.0.2'] };

console.log('%%direct%%:', clientIp(fake('198.51.100.4', '192.0.2.99'), options));
console.log('%%viaProxy%%:', clientIp(fake('10.0.0.2', '203.0.113.7'), options));
console.log('%%spoofedViaProxy%%:', clientIp(fake('10.0.0.2', '192.0.2.66, 203.0.113.7'), options));
