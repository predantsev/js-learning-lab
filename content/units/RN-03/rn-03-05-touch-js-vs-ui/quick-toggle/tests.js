import { reportStarts } from './report.js';

const toggles = () => screen.allByRole('button');
const reportNumbers = () => {
  const match = screen.text().match(new RegExp(`${L.report}: (\\d+) / (\\d+)`));
  return match ? { done: Number(match[1]), total: Number(match[2]) } : null;
};

test('every toggle is at least 48 × 48', async () => {
  await waitFor(() => toggles().length === 4);
  for (const button of toggles()) {
    const box = button.getBoundingClientRect();
    expect(Math.round(box.width), `width of “${screen.nameOf(button)}”`).toBeGreaterThanOrEqual(48);
    expect(Math.round(box.height), `height of “${screen.nameOf(button)}”`).toBeGreaterThanOrEqual(48);
  }
});

test('the row shows the new state before the report is rebuilt', async () => {
  const first = await waitFor(() => toggles()[0]);
  const wasDone = first.textContent.includes('✓');
  let shownAt = null;
  const observer = new MutationObserver(() => {
    if (shownAt === null && toggles()[0].textContent.includes('✓') !== wasDone) shownAt = performance.now();
  });
  observer.observe(document.getElementById('root'), { subtree: true, childList: true, characterData: true });
  const before = reportStarts.length;
  await user.click(first);
  await waitFor(() => shownAt !== null && reportStarts.length > before, { timeout: 3000 });
  observer.disconnect();
  expect(shownAt < reportStarts[before], 'the row changed before the report started').toBe(true);
});

test('the report catches up with every toggle', async () => {
  await waitFor(() => toggles().length === 4);
  await user.click(toggles()[1]);
  const doneRows = () => toggles().filter((button) => button.textContent.includes('✓')).length;
  await waitFor(() => reportNumbers()?.done === 50000 + doneRows(), { timeout: 3000 });
  expect(reportNumbers(), 'the report line').toEqual({ done: 50000 + doneRows(), total: 50004 });
});
