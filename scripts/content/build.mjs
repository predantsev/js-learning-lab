// Compile course content to dist/content. Exit code 1 when static issues are found.
import { buildContent } from './lib.mjs';

const { issues } = await buildContent();
for (const issue of issues) console.error(`✖ ${issue.file ? `${issue.file}: ` : ''}${issue.path} — ${issue.message}`);
if (issues.length > 0 && !process.argv.includes('--allow-issues')) process.exitCode = 1;
