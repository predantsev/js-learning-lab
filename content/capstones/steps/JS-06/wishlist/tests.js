// Checks of capstone step JS-06, wishlist variant: the cards are built from the data, the labeled
// form adds and edits wishes with validateItem's messages next to the fields, delete asks for a
// confirmation first, and the starting list items never changes. The checks run one after another
// on the same page, like a person using it. Focus is not checked (it is unreliable in the hidden
// frame the checks run in); the task asks the learner to check it by keyboard.
const norm = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
/** `text` contains every part, in this order (case and extra spaces do not matter). */
function inOrder(text, ...parts) {
  const t = norm(text);
  let from = 0;
  for (const part of parts.map(norm)) {
    const at = t.indexOf(part, from);
    if (at < 0) return false;
    from = at + part.length;
  }
  return true;
}
const form = () => screen.$('form');
/** The form field whose label contains `label`. */
const field = (label) => [...(form()?.querySelectorAll('input, select, textarea') ?? [])].find((node) => inOrder(screen.nameOf(node), label)) ?? null;
/** Put a value into a field the way the page receives it (also for number fields). */
async function setValue(node, value) {
  node.focus();
  node.value = value;
  node.dispatchEvent(new Event('input', { bubbles: true }));
  node.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}
/** The text of the elements a field names in aria-describedby. */
const describedText = (node) => (node?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
const list = () => screen.$('#items');
const cards = () => [...(list()?.querySelectorAll('[data-id]') ?? [])];
const card = (id) => cards().find((node) => node.dataset.id === id) ?? null;
const buttonIn = (node, label, unless = null) => [...(node?.querySelectorAll('button') ?? [])].find((button) => inOrder(screen.nameOf(button), label) && !(unless !== null && inOrder(screen.nameOf(button), unless))) ?? null;
const fixtures = () => [
  { id: 'w-01', name: L.fixture1Name, price: 80, acquired: false, category: L.techCategory },
  { id: 'w-02', name: L.fixture2Name, price: 45, acquired: false, category: L.homeCategory },
  { id: 'w-03', name: L.fixture3Name, price: 240, acquired: false, category: L.sportCategory },
  { id: 'w-04', name: L.fixture4Name, price: 25, acquired: true, category: L.booksCategory },
  { id: 'w-05', name: L.fixture5Name, price: null, acquired: false, category: null },
  { id: 'w-06', name: L.fixture6Name, price: 18, acquired: true, category: L.homeCategory },
];

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('the form has labeled fields and a submit button', () => {
  expect(form(), 'a <form> on the page').toBeTruthy();
  for (const label of [L.nameLabel, L.valueLabel, L.categoryFieldLabel, L.acquiredFieldLabel]) {
    expect(field(label), `a form field labeled "${label}"`).toBeTruthy();
  }
  expect(field(L.acquiredFieldLabel).type, `the type of the field "${L.acquiredFieldLabel}"`).toBe('checkbox');
  expect(form().querySelector('button[type="submit"], button:not([type]), input[type="submit"]'), 'a submit button inside the form').toBeTruthy();
});

test('every wish is a card with its name, price, category and named buttons', () => {
  expect(list(), 'the list with id="items"').toBeTruthy();
  expect(cards().length, 'cards with data-id in #items').toBe(6);
  for (const item of fixtures()) {
    const node = card(item.id);
    expect(node, `the card with data-id="${item.id}"`).toBeTruthy();
    expect(inOrder(node.textContent, item.name, String(item.price ?? L.noPrice)), `the card ${item.id} shows "${item.name}" and then "${item.price ?? L.noPrice}"`).toBe(true);
    if (item.category !== null) expect(inOrder(node.textContent, item.category), `the card ${item.id} shows the category "${item.category}"`).toBe(true);
    expect(inOrder(node.textContent, L.acquiredMark), `the card ${item.id} has the mark "${L.acquiredMark}"`).toBe(item.acquired);
    for (const label of [L.editLabel, L.deleteLabel]) {
      const button = buttonIn(node, label);
      expect(button, `a "${label}" button in the card ${item.id}`).toBeTruthy();
      expect(inOrder(screen.nameOf(button), item.name), `the "${label}" button of ${item.id} also names "${item.name}"`).toBe(true);
    }
  }
});

test('an invalid draft shows messages next to its fields and adds nothing', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), '');
  await setValue(field(L.valueLabel), '-5');
  const { prevented } = await user.submit(form());
  expect(prevented, 'the form submit is prevented').toBe(true);
  expect(cards().length, 'the number of cards after submitting an invalid draft').toBe(before);
  expect(inOrder(describedText(field(L.nameLabel)), L.requiredMessage), `"${L.requiredMessage}" in the element the name field names in aria-describedby`).toBe(true);
  expect(inOrder(describedText(field(L.valueLabel)), L.invalidMessage), `"${L.invalidMessage}" in the element the price field names in aria-describedby`).toBe(true);
});

test('a valid draft adds a card, clears the form and the messages and updates the summary', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), '30');
  const { prevented } = await user.submit(form());
  expect(prevented, 'the form submit is prevented').toBe(true);
  expect(cards().length, 'the number of cards after adding a wish').toBe(before + 1);
  expect(cards().some((node) => inOrder(node.textContent, L.newName, '30')), `a card with "${L.newName}" and 30`).toBe(true);
  expect(field(L.nameLabel).value, 'the name field after adding').toBe('');
  expect(inOrder(describedText(field(L.nameLabel)), L.requiredMessage) || inOrder(describedText(field(L.valueLabel)), L.invalidMessage), 'an old error message is still shown').toBe(false);
  expect([...(screen.$('main')?.querySelectorAll('*') ?? [])].some((node) => inOrder(node.textContent, L.summaryWantedTotal, '395')), `"${L.summaryWantedTotal}" with 395 (365 + 30) on the page`).toBe(true);
});

test('a wish without a price shows the no-price text, and a name with markup stays text', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), '<b>Bold</b>');
  await setValue(field(L.valueLabel), '');
  await user.submit(form());
  expect(cards().length, 'the number of cards after adding a wish without a price').toBe(before + 1);
  const added = cards().find((node) => node.textContent.includes('<b>Bold</b>'));
  expect(added, 'a card whose text shows "<b>Bold</b>" literally').toBeTruthy();
  expect(inOrder(added.textContent, L.noPrice), `"${L.noPrice}" in that card (an empty price field means no price, not 0)`).toBe(true);
  expect(list().querySelector('b'), 'a <b> element made from the name').toBeNull();
});

test('a new wish keeps its category and the acquired box', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), 'Garden chair');
  await setValue(field(L.valueLabel), '60');
  await setValue(field(L.categoryFieldLabel), 'Outdoor');
  await user.check(field(L.acquiredFieldLabel), true);
  await user.submit(form());
  expect(cards().length, 'the number of cards after adding a wish with a category and the acquired box ticked').toBe(before + 1);
  const added = cards().find((node) => inOrder(node.textContent, 'Garden chair'));
  expect(added, 'a card with "Garden chair"').toBeTruthy();
  expect(inOrder(added.textContent, 'Outdoor'), 'the category "Outdoor" in that card').toBe(true);
  expect(inOrder(added.textContent, L.acquiredMark), `the mark "${L.acquiredMark}" in that card`).toBe(true);
});

test('Edit fills the form and saving changes only that wish', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('w-02'), L.editLabel));
  expect(field(L.nameLabel).value, 'the name field after Edit of w-02').toBe(L.fixture2Name);
  expect(field(L.valueLabel).value, 'the price field after Edit of w-02').toBe('45');
  await setValue(field(L.valueLabel), '50');
  await user.check(field(L.acquiredFieldLabel), true);
  await user.submit(form());
  expect(cards().length, 'the number of cards after saving an edit').toBe(before);
  expect(inOrder(card('w-02')?.textContent, L.fixture2Name, '50'), `the card w-02 shows "${L.fixture2Name}" and 50`).toBe(true);
  expect(inOrder(card('w-02')?.textContent, L.acquiredMark), `the card w-02 has the mark "${L.acquiredMark}"`).toBe(true);
  expect(cards().filter((node) => inOrder(node.textContent, L.fixture2Name)).length, `cards showing "${L.fixture2Name}"`).toBe(1);
  expect(inOrder(card('w-01')?.textContent, L.acquiredMark), 'the card w-01 has no acquired mark').toBe(false);
});

test('Delete asks for confirmation and Cancel keeps the wish', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('w-03'), L.deleteLabel, L.confirmDeleteLabel));
  expect(card('w-03'), 'the card w-03 right after Delete').toBeTruthy();
  expect(buttonIn(card('w-03'), L.confirmDeleteLabel), `a "${L.confirmDeleteLabel}" button in the card w-03`).toBeTruthy();
  await user.click(buttonIn(card('w-03'), L.cancelLabel));
  expect(card('w-03'), 'the card w-03 after Cancel').toBeTruthy();
  expect(buttonIn(card('w-03'), L.confirmDeleteLabel), `the "${L.confirmDeleteLabel}" button after Cancel`).toBeNull();
  expect(cards().length, 'the number of cards after Cancel').toBe(before);
});

test('confirming the delete removes only that wish', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('w-03'), L.deleteLabel, L.confirmDeleteLabel));
  await user.click(buttonIn(card('w-03'), L.confirmDeleteLabel));
  expect(card('w-03'), 'the card w-03 after the confirmed delete').toBeNull();
  expect(cards().length, 'the number of cards after the confirmed delete').toBe(before - 1);
  expect(card('w-02') !== null && card('w-04') !== null, 'the cards w-02 and w-04').toBe(true);
});

test('items stays the starting list', () => {
  expect(scope.items, 'the list items after adding, editing and deleting on the page').toEqual(fixtures());
});
