// Demo: check the transport settings of every build.
import { configs } from './configs.js';
import { assertReleaseTransport } from './transport.js';

for (const config of configs) {
  try {
    assertReleaseTransport(config);
    console.log(`${config.name}: ok`);
  } catch (error) {
    console.log(`${config.name}: ${error.message}`);
  }
}
