// Checks of capstone step JS-06, habit tracker variant: the cards are built from the data, the
// labeled form adds and edits habits with validateHabit's messages next to the fields, delete asks
// for a confirmation first, and the starting list habits never changes. The checks run one after
// another on the same page, like a person using it. Focus is not checked (it is unreliable in the
// hidden frame the checks run in); the task asks the learner to check it by keyboard.
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
/** Put a value into a field the way the page receives it (also for selects). */
async function setValue(node, value) {
  node.focus();
  node.value = value;
  node.dispatchEvent(new Event('input', { bubbles: true }));
  node.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}
/** The text of the elements a field names in aria-describedby. */
const describedText = (node) => (node?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
const list = () => screen.$('#habits');
const cards = () => [...(list()?.querySelectorAll('[data-id]') ?? [])];
const card = (id) => cards().find((node) => node.dataset.id === id) ?? null;
const buttonIn = (node, label, unless = null) => [...(node?.querySelectorAll('button') ?? [])].find((button) => inOrder(screen.nameOf(button), label) && !(unless !== null && inOrder(screen.nameOf(button), unless))) ?? null;
const WORDS = () => ({ daily: L.daily, weekly: L.weekly });
const fixtures = () => [
  { id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.fixture3Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: L.fixture4Name, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: L.fixture5Name, frequency: 'daily', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: L.fixture6Name, frequency: 'daily', active: true, completions: [] },
];

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('the form has labeled fields and a submit button', () => {
  expect(form(), 'a <form> on the page').toBeTruthy();
  for (const label of [L.nameLabel, L.valueLabel, L.activeFieldLabel]) {
    expect(field(label), `a form field labeled "${label}"`).toBeTruthy();
  }
  expect(field(L.valueLabel).tagName, `the element of the field "${L.valueLabel}"`).toBe('SELECT');
  expect(field(L.activeFieldLabel).type, `the type of the field "${L.activeFieldLabel}"`).toBe('checkbox');
  expect(form().querySelector('button[type="submit"], button:not([type]), input[type="submit"]'), 'a submit button inside the form').toBeTruthy();
});

test('every habit is a card with its name, frequency, state, completions and named buttons', () => {
  expect(list(), 'the list with id="habits"').toBeTruthy();
  expect(cards().length, 'cards with data-id in #habits').toBe(6);
  for (const habit of fixtures()) {
    const node = card(habit.id);
    expect(node, `the card with data-id="${habit.id}"`).toBeTruthy();
    expect(inOrder(node.textContent, habit.name, WORDS()[habit.frequency]), `the card ${habit.id} shows "${habit.name}" and then "${WORDS()[habit.frequency]}"`).toBe(true);
    expect(inOrder(node.textContent, L.pausedMark), `the card ${habit.id} has the mark "${L.pausedMark}"`).toBe(!habit.active);
    expect(inOrder(node.textContent, L.completionsLabel, String(habit.completions.length)), `the card ${habit.id} shows "${L.completionsLabel}" and ${habit.completions.length}`).toBe(true);
    for (const label of [L.editLabel, L.deleteLabel]) {
      const button = buttonIn(node, label);
      expect(button, `a "${label}" button in the card ${habit.id}`).toBeTruthy();
      expect(inOrder(screen.nameOf(button), habit.name), `the "${label}" button of ${habit.id} also names "${habit.name}"`).toBe(true);
    }
  }
});

test('an invalid draft shows messages next to its fields and adds nothing', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), '');
  const first = await user.submit(form());
  expect(first.prevented, 'the form submit is prevented').toBe(true);
  expect(inOrder(describedText(field(L.nameLabel)), L.requiredMessage), `"${L.requiredMessage}" in the element the name field names in aria-describedby`).toBe(true);
  await setValue(field(L.nameLabel), 'x'.repeat(81));
  await user.submit(form());
  expect(inOrder(describedText(field(L.nameLabel)), L.tooLongMessage), `"${L.tooLongMessage}" for a name of 81 characters`).toBe(true);
  expect(cards().length, 'the number of cards after submitting invalid drafts').toBe(before);
});

test('a valid draft adds a card, clears the form and the messages and updates the summary', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), 'weekly');
  const { prevented } = await user.submit(form());
  expect(prevented, 'the form submit is prevented').toBe(true);
  expect(cards().length, 'the number of cards after adding a habit').toBe(before + 1);
  const added = cards().find((node) => inOrder(node.textContent, L.newName));
  expect(added, `a card with "${L.newName}"`).toBeTruthy();
  expect(inOrder(added.textContent, L.weekly) && inOrder(added.textContent, L.completionsLabel, '0'), `the card of "${L.newName}" shows "${L.weekly}" and ${L.completionsLabel} 0`).toBe(true);
  expect(inOrder(added.textContent, L.pausedMark), 'the new habit is active (the checkbox starts ticked)').toBe(false);
  expect(field(L.nameLabel).value, 'the name field after adding').toBe('');
  expect(inOrder(describedText(field(L.nameLabel)), L.requiredMessage) || inOrder(describedText(field(L.nameLabel)), L.tooLongMessage), 'an old error message is still shown').toBe(false);
  const outside = [...(screen.$('main')?.querySelectorAll('*') ?? [])].filter((node) => !node.contains(list()) && !list().contains(node));
  expect(outside.some((node) => inOrder(node.textContent, L.newName)), `"${L.newName}" in the summary outside the list`).toBe(true);
});

test('an inactive habit shows the paused mark, and a name with markup stays text', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), '<b>Bold</b>');
  await user.check(field(L.activeFieldLabel), false);
  await user.submit(form());
  expect(cards().length, 'the number of cards after adding a paused habit').toBe(before + 1);
  const added = cards().find((node) => node.textContent.includes('<b>Bold</b>'));
  expect(added, 'a card whose text shows "<b>Bold</b>" literally').toBeTruthy();
  expect(inOrder(added.textContent, L.pausedMark), `"${L.pausedMark}" in that card`).toBe(true);
  expect(list().querySelector('b'), 'a <b> element made from the name').toBeNull();
});

test('Edit fills the form and saving changes only that habit', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('h-02'), L.editLabel));
  expect(field(L.nameLabel).value, 'the name field after Edit of h-02').toBe(L.fixture2Name);
  expect(field(L.valueLabel).value, 'the frequency field after Edit of h-02').toBe('daily');
  await setValue(field(L.valueLabel), 'weekly');
  await user.check(field(L.activeFieldLabel), false);
  await user.submit(form());
  expect(cards().length, 'the number of cards after saving an edit').toBe(before);
  expect(inOrder(card('h-02')?.textContent, L.fixture2Name, L.weekly), `the card h-02 shows "${L.fixture2Name}" and "${L.weekly}"`).toBe(true);
  expect(inOrder(card('h-02')?.textContent, L.pausedMark), `the card h-02 has the mark "${L.pausedMark}"`).toBe(true);
  expect(inOrder(card('h-02')?.textContent, L.completionsLabel, '3'), `the card h-02 still shows ${L.completionsLabel} 3`).toBe(true);
  expect(cards().filter((node) => inOrder(node.textContent, L.fixture2Name)).length, `cards showing "${L.fixture2Name}"`).toBe(1);
  expect(inOrder(card('h-01')?.textContent, L.pausedMark), 'the card h-01 has no paused mark').toBe(false);
});

test('Delete asks for confirmation and Cancel keeps the habit', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('h-03'), L.deleteLabel, L.confirmDeleteLabel));
  expect(card('h-03'), 'the card h-03 right after Delete').toBeTruthy();
  expect(buttonIn(card('h-03'), L.confirmDeleteLabel), `a "${L.confirmDeleteLabel}" button in the card h-03`).toBeTruthy();
  await user.click(buttonIn(card('h-03'), L.cancelLabel));
  expect(card('h-03'), 'the card h-03 after Cancel').toBeTruthy();
  expect(buttonIn(card('h-03'), L.confirmDeleteLabel), `the "${L.confirmDeleteLabel}" button after Cancel`).toBeNull();
  expect(cards().length, 'the number of cards after Cancel').toBe(before);
});

test('confirming the delete removes only that habit', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('h-03'), L.deleteLabel, L.confirmDeleteLabel));
  await user.click(buttonIn(card('h-03'), L.confirmDeleteLabel));
  expect(card('h-03'), 'the card h-03 after the confirmed delete').toBeNull();
  expect(cards().length, 'the number of cards after the confirmed delete').toBe(before - 1);
  expect(card('h-02') !== null && card('h-04') !== null, 'the cards h-02 and h-04').toBe(true);
});

test('habits stays the starting list', () => {
  expect(scope.habits, 'the list habits after adding, editing and deleting on the page').toEqual(fixtures());
});
