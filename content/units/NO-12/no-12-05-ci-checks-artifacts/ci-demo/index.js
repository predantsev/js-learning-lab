// Runs the pipeline once and reports whether an artifact exists afterwards.
import { readdir } from 'node:fs/promises';
import { runPipeline } from './ci.js';

const passed = await runPipeline();
const artifacts = await readdir('artifacts').catch(() => []);
console.log(passed ? `✔ %%passed%%` : `%%failed%%`);
console.log(`artifacts/: ${artifacts.length === 0 ? '%%empty%%' : artifacts.join(', ')}`);
