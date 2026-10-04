// clientIp on synthetic requests, then over a real loopback connection.
import { createApp } from './app.js';
import { clientIp } from './client-ip.js';

const fake = (peer, forwardedFor) => ({ socket: { remoteAddress: peer }, headers: forwardedFor === undefined ? {} : { 'x-forwarded-for': forwardedFor } });
const ip = (peer, forwardedFor, trustedProxies) => {
  expect(typeof clientIp, 'type of clientIp').toBe('function');
  return clientIp(fake(peer, forwardedFor), { trustedProxies });
};

test('a direct client gets its socket address, whatever its headers say', () => {
  expect(ip('198.51.100.4', '192.0.2.99', ['10.0.0.2']), 'direct client with X-Forwarded-For').toBe('198.51.100.4');
  expect(ip('198.51.100.4', undefined, ['10.0.0.2']), 'direct client without the header').toBe('198.51.100.4');
  expect(ip('198.51.100.4', '192.0.2.99', []), 'no trusted proxies at all').toBe('198.51.100.4');
});

test('behind a trusted proxy the rightmost entry counts, not a spoofed one on the left', () => {
  expect(ip('10.0.0.2', '203.0.113.7', ['10.0.0.2']), 'one entry from the proxy').toBe('203.0.113.7');
  expect(ip('10.0.0.2', '192.0.2.66,203.0.113.7', ['10.0.0.2']), 'a spoofed entry before the real one').toBe('203.0.113.7');
});

test('entries added by other trusted proxies are skipped', () => {
  expect(ip('10.0.0.2', '203.0.113.7,10.0.0.3', ['10.0.0.2', '10.0.0.3']), 'two trusted proxies in a row').toBe('203.0.113.7');
});

test('spaces around entries are ignored, and a missing header gives the socket address', () => {
  expect(ip('10.0.0.2', ' 203.0.113.7 ,  198.51.100.4 ', ['10.0.0.2']), 'entries with extra spaces').toBe('198.51.100.4');
  expect(ip('10.0.0.2', undefined, ['10.0.0.2']), 'a trusted proxy without the header').toBe('10.0.0.2');
});

test('over a real connection a spoofed header is ignored unless loopback is a trusted proxy', async () => {
  const direct = await request(`${await listen(createApp({ trustedProxies: [] }))}/`, { headers: { 'x-forwarded-for': '203.0.113.7' } });
  expect(direct.json?.client, 'client when nothing is trusted').toBe('127.0.0.1');
  const proxied = await request(`${await listen(createApp({ trustedProxies: ['127.0.0.1'] }))}/`, { headers: { 'x-forwarded-for': '203.0.113.7' } });
  expect(proxied.json?.client, 'client when 127.0.0.1 is the trusted proxy').toBe('203.0.113.7');
});
