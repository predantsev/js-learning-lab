// Demo: the screen code reads the pending tasks through the fixture source.
import { bundledTasks } from './bundled.ts';
import { pendingTitles } from './screen.ts';
import { createFixtureSource } from './source.ts';

const source = createFixtureSource(bundledTasks);
console.log(await pendingTitles(source));
