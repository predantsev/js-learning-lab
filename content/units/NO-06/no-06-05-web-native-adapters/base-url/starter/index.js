// Prints the base URL of every target for two server configurations: loopback only, and a LAN bind.
import { resolveBaseUrl } from './base-url.js';

const configs = [
  ['%%loopback%%', { port: 7330, bindHost: '127.0.0.1', lanAddress: '192.168.1.20' }],
  ['%%lanBind%%', { port: 7330, bindHost: '0.0.0.0', lanAddress: '192.168.1.20' }],
];
for (const [label, config] of configs) {
  console.log(label);
  for (const target of ['web', 'ios-simulator', 'android-emulator', 'device']) {
    try {
      console.log(`  ${target}: ${resolveBaseUrl(target, config)}`);
    } catch (error) {
      console.log(`  ${target}: ${error.name}: ${error.message}`);
    }
  }
}
