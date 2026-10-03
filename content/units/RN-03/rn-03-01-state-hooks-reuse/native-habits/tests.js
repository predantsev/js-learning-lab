import { memoryStorage } from './storage.js';

const names = () => [L.exercise, L.water, L.tidy, L.words];

test('every element on the screen comes from a React Native component', async () => {
  await waitFor(() => screen.text().includes(L.exercise));
  const elements = [...document.getElementById('root').querySelectorAll('*')];
  const web = elements.filter((el) => !/(^|\s)(css|r)-/.test(el.getAttribute('class') ?? ''));
  expect(web.map((el) => el.tagName.toLowerCase()), 'elements written as web tags').toEqual([]);
});

test('every piece of text sits inside Text', async () => {
  await waitFor(() => screen.text().includes(L.exercise));
  const bare = rawLogs().filter((entry) => entry.level === 'error' && String(entry.args[0]).includes('text node'));
  expect(bare.length, 'warnings about text directly inside a View').toBe(0);
});

test('each habit name is shown', async () => {
  await waitFor(() => screen.text().includes(L.exercise));
  for (const name of names()) expect(screen.text(), 'the screen text').toContain(name);
});

test('every pause or resume control is announced as a button', async () => {
  await waitFor(() => screen.text().includes(L.exercise));
  const buttons = screen.allByRole('button');
  expect(buttons.length, 'number of buttons').toBe(4);
  expect(buttons[0], 'the first button').toHaveTextContent(L.pause);
});

test('pressing the first button pauses the habit through the shared reducer and saves it', async () => {
  const first = await waitFor(() => screen.allByRole('button')[0]);
  await user.click(first);
  await waitFor(() => screen.allByRole('button')[0].textContent.includes(L.resume));
  const saved = memoryStorage.last()?.find((habit) => habit.id === 'h-01');
  expect(saved?.active, 'h-01 in the last save').toBe(false);
});
