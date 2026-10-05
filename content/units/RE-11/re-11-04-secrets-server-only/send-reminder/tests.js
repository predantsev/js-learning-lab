import { bundle } from './bundle';
import * as publicConfig from './public-config';
import * as serverModule from './reminders.server';

const KEY = 'demo-REM1-not-a-real-key';

// The client bundle, or the BuildError that stopped it.
async function clientBundle() {
  try {
    return { files: await bundle('./ReminderButton.tsx'), error: null };
  } catch (error) {
    return { files: [], error };
  }
}

test('the client bundle includes no .server module', async () => {
  const { error } = await clientBundle();
  expect(error === null ? 'no build error' : `${error.name}: ${error.message}`, 'the result of bundling ReminderButton.tsx').toBe('no build error');
});

test('the client bundle does not contain the reminder key', async () => {
  const { files, error } = await clientBundle();
  expect(error, 'the build error of the client bundle').toBeNull();
  const leaked = files.filter((entry) => entry.text.includes(KEY)).map((entry) => entry.file);
  expect(leaked, 'the client bundle files that contain the key').toEqual([]);
});

test('every module that holds the key is server-only: a client import of it stops the build', async () => {
  // Any of the learner's modules whose text holds the key must be refused as client code, so that a
  // future client import of it fails loudly instead of leaking the key.
  const editable = ['ReminderButton.tsx', 'public-config.ts', 'reminders.server.ts', 'config.ts'];
  const holders = editable.filter((path) => typeof files[path] === 'string' && files[path].includes(KEY));
  const shippable = [];
  for (const path of holders) {
    try {
      await bundle(`./${path}`);
      shippable.push(path);
    } catch (error) {
      if (error?.name !== 'BuildError') throw error;
    }
  }
  expect(shippable, 'modules with the key that a client could still import without a build error').toEqual([]);
});

test('public-config.ts exports APP_NAME and MAX_REMINDERS, and no value equal to the key', () => {
  expect(publicConfig.APP_NAME, 'APP_NAME from public-config.ts').toBe(L.appName);
  expect(publicConfig.MAX_REMINDERS, 'MAX_REMINDERS from public-config.ts').toBe(3);
  expect(Object.values(publicConfig).includes(KEY), 'public-config.ts exports the key').toBe(false);
});

test('sendReminder from reminders.server.ts still uses the key', async () => {
  expect(typeof serverModule.sendReminder, 'type of sendReminder from reminders.server.ts').toBe('function');
  expect(await serverModule.sendReminder('t-05'), 'await sendReminder("t-05")').toBe('sent t-05 (key demo…)');
});

test('the page shows the app name and the limit, and the button queues a reminder', async () => {
  expect(screen.$('h1'), 'the heading').toHaveTextContent(L.appName);
  expect(screen.text(), 'the page text').toContain(`${L.limit} 3`);
  await user.click(screen.byRole('button', { name: L.remind }));
  await waitFor(() => screen.$('output')?.textContent !== '', { timeout: 1000 }).catch(() => {});
  expect(screen.$('output'), 'the <output> after the click').toHaveTextContent('queued t-05');
});
