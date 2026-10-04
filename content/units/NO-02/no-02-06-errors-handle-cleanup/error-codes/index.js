// Four ways a file operation fails, and the error.code each one carries.
import { chmod, mkdir, open, readFile, writeFile } from 'node:fs/promises';

await mkdir('data', { recursive: true });
await writeFile('data/habits.json', '[]');
await writeFile('data/locked.json', '[]');
await chmod('data/locked.json', 0o000); // nobody may read it now (macOS and Linux, as a normal user)

const attempts = {
  'a file that does not exist': () => readFile('data/expenses.json', 'utf8'),
  'a folder instead of a file': () => readFile('data', 'utf8'),
  "'wx': create, but it exists": () => open('data/habits.json', 'wx'),
  'no permission to read': () => readFile('data/locked.json', 'utf8'),
};

for (const [what, attempt] of Object.entries(attempts)) {
  try {
    await attempt();
    console.log(`${what}: no error`);
  } catch (error) {
    console.log(`${what}: ${error.code}`);
    console.log(`  ${error.message}`);
  }
}
