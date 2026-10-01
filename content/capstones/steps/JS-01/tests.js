// Checks of capstone step JS-01, shared by the four capstones. Domain text comes from L: the step
// strings in the language the learner's project was created in.
const textOf = (node) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/** An element inside <main> shows `value`, and `label` is written in it or in a close parent (not <main> itself). */
function labeledInMain(label, value) {
  const root = screen.$('main');
  if (!root) return false;
  const want = value.toLowerCase();
  const holders = [root, ...root.querySelectorAll('*')].filter((n) => textOf(n).includes(want) && ![...n.children].some((c) => textOf(c).includes(want)));
  return holders.some((holder) => {
    for (let node = holder, depth = 0; node && depth < 4; node = node.parentElement, depth += 1) {
      if (node === root && holder !== root) return false;
      if (textOf(node).includes(label.toLowerCase())) return true;
    }
    return false;
  });
}

test('page keeps its main landmark', () => {
  expect(screen.$$('main'), 'number of <main> elements').toHaveLength(1);
});

test('tab title names the project', () => {
  expect(document.title.toLowerCase(), 'text of <title>').toContain(L.projectTitle.toLowerCase());
});

test('heading names the project', () => {
  const heading = screen.$('main h1');
  expect(heading, 'the <h1> inside <main>').toBeTruthy();
  expect(textOf(heading), 'text of the <h1>').toContain(L.projectTitle.toLowerCase());
});

test('record name is shown with its label', () => {
  expect(labeledInMain(L.nameLabel, L.nameValue), `"${L.nameLabel}" next to "${L.nameValue}" inside <main>`).toBe(true);
});

test('second value is shown with its label', () => {
  expect(labeledInMain(L.valueLabel, L.valueCheck), `"${L.valueLabel}" next to "${L.valueCheck}" inside <main>`).toBe(true);
});

test('picture has alt text and is shown', async () => {
  const img = screen.$('main img');
  expect(img, 'an <img> inside <main>').toBeTruthy();
  expect((img.getAttribute('alt') ?? '').trim().length, 'length of the alt text').toBeGreaterThan(0);
  const shown = await waitFor(() => img.complete && img.naturalWidth > 0).then(() => true, () => false);
  expect(shown, 'the picture file was found and shown').toBe(true);
});
