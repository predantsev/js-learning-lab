// Runs the simulated build, then opens the capture screen on both platforms. Do not edit.
import { build, prebuild, openCapture } from './nativeSim.js';
import { dependencies } from './deps.js';
import { appJson } from './appJson.js';

console.log('— %%buildLog%% —');
const result = build(dependencies);
for (const line of result.log) console.log(line);

if (result.ok) {
  const native = prebuild(appJson);
  for (const platform of ['ios', 'android']) {
    console.log(`— %%deviceLog%% (${platform}) —`);
    for (const line of openCapture(platform, native).log) console.log(line);
  }
}
