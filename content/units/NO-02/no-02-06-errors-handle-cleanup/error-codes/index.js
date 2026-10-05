// Four ways a file operation fails, and the error.code each one carries.
import { chmod, mkdir, open, readFile, writeFile } from 'node:fs/promises';

await mkdir('data', { recursive: true });
await writeFile('data/habits.json', '[]');
await writeFile('data/locked.json', '[]');
await chmod('data/locked.json', 0o000); // nobody may read it now (macOS and Linux, as a normal user)

const attempts = {
  '%%missingFile%%': () => readFile('data/expenses.json', 'utf8'),
  '%%folderNotFile%%': () => readFile('data', 'utf8'),
  "'wx': %%wxExists%%": () => open('data/habits.json', 'wx'),
  '%%noPermission%%': () => readFile('data/locked.json', 'utf8'),
};

for (const [what, attempt] of Object.entries(attempts)) {
  try {
    await attempt();
    console.log(`${what}: %%noError%%`);
  } catch (error) {
    console.log(`${what}: ${error.code}`);
    console.log(`  ${error.message}`);
  }
}
