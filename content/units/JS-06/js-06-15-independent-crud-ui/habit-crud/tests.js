// ---------- helpers ----------
// Render a copy of the page in a frame of the given width (a window of its own, so media queries
// see exactly that width) and report the columns of cards and whether the page scrolls sideways.
function measureAt(width) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.style.cssText = `position:absolute;left:-10000px;top:0;border:0;width:${width}px;height:700px`;
    const copy = document.documentElement.cloneNode(true);
    copy.querySelectorAll('script, iframe').forEach((node) => node.remove());
    const probe = `<script>addEventListener('load', () => {
      const lefts = new Set([...document.querySelectorAll('#habits > li')].map((card) => Math.round(card.getBoundingClientRect().left)));
      parent.postMessage({ jsllProbe: true, columns: lefts.size, overflow: document.documentElement.scrollWidth > innerWidth }, '*');
    });<\/script>`;
    frame.srcdoc = `<!doctype html>${copy.outerHTML.replace('</body>', `${probe}</body>`)}`;
    const timer = setTimeout(() => finish(new Error('the measuring frame did not answer')), 3000);
    function onMessage(event) {
      if (event.source === frame.contentWindow && event.data && event.data.jsllProbe) finish(null, event.data);
    }
    function finish(error, data) {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      if (error) reject(error);
      else resolve(data);
    }
    window.addEventListener('message', onMessage);
    document.body.append(frame);
  });
}

// Pretend the person chose a motion preference by rewriting the page's media rule conditions for a moment.
function withMotionPreference(preference, measure) {
  const yes = '(min-width: 0px)';
  const no = '(max-width: 0px)';
  const whenReduce = preference === 'reduce' ? yes : no;
  const whenNoPreference = preference === 'reduce' ? no : yes;
  const changed = [];
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        const before = rule.media.mediaText;
        const after = before
          .replace(/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/g, whenReduce)
          .replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, whenNoPreference)
          .replace(/\(\s*prefers-reduced-motion\s*\)/g, whenReduce);
        if (after !== before) {
          rule.media.mediaText = after;
          changed.push([rule, before]);
        }
      }
      if (rule.cssRules) walk(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) walk(sheet.cssRules);
  try {
    return measure();
  } finally {
    for (const [rule, before] of changed) rule.media.mediaText = before;
  }
}

const animates = (element) => {
  const s = getComputedStyle(element);
  const transition = s.transitionProperty !== 'none' && s.transitionDuration.split(',').some((duration) => parseFloat(duration) > 0.01);
  const animation = s.animationName !== 'none' && s.animationDuration.split(',').some((duration) => parseFloat(duration) > 0.01);
  return transition || animation;
};

const allRules = () => {
  const out = [];
  const walk = (rules) => { for (const rule of rules) { out.push(rule); if (rule.cssRules) walk(rule.cssRules); } };
  for (const sheet of document.styleSheets) walk(sheet.cssRules);
  return out;
};

const cards = () => screen.$$('#habits > li');
const cardOf = (id) => screen.$(`#habits > li[data-id="${id}"]`);
const buttonIn = (card, action) => card.querySelector(`button[data-action="${action}"]`);
const visibleText = (element) => (element === null || element.hidden || getComputedStyle(element).display === 'none' ? '' : element.textContent.trim());
const describedText = (field) => (field.getAttribute('aria-describedby') ?? '')
  .split(/\s+/).filter(Boolean).map((id) => visibleText(document.getElementById(id))).join(' ').trim();

async function fillForm(name, minutes) {
  await user.fill(screen.$('#name'), name);
  await user.fill(screen.$('#minutes'), String(minutes));
}

// ---------- structure and form ----------
test('the page has header, nav and main landmarks and one h1 in the header', () => {
  expect(screen.$('header'), 'a <header> element').toBeTruthy();
  expect(screen.$('nav'), 'a <nav> element').toBeTruthy();
  expect(screen.$('main'), 'a <main> element').toBeTruthy();
  expect(screen.$$('h1'), 'the h1 headings').toHaveLength(1);
  expect(screen.$('header h1'), 'the h1 inside the header').toBeTruthy();
});

test('the form fields have labels and the form has a submit button', () => {
  expect(screen.$('#habit-form'), 'the form #habit-form').toBeTruthy();
  expect(screen.nameOf(screen.$('#name')), 'the accessible name of #name').toBeTruthy();
  expect(screen.nameOf(screen.$('#minutes')), 'the accessible name of #minutes').toBeTruthy();
  expect(screen.$('#habit-form button[type="submit"]'), 'a button with type="submit" in the form').toBeTruthy();
});

// ---------- rendering ----------
test('on load every habit is a card with its name, minutes and named buttons', () => {
  expect(cards(), 'the cards (li) in #habits').toHaveLength(scope.habits.length);
  scope.habits.forEach((habit, i) => {
    const card = cards()[i];
    expect(card.dataset.id, `the data-id of card ${i + 1}`).toBe(habit.id);
    expect(card, `card ${i + 1}`).toHaveTextContent(habit.name);
    expect(card, `card ${i + 1}`).toHaveTextContent(String(habit.minutes));
    for (const [action, word] of [['edit', L.edit], ['delete', L.delete]]) {
      const button = buttonIn(card, action);
      expect(button, `a button with data-action="${action}" in card ${i + 1}`).toBeTruthy();
      expect(button.getAttribute('type'), `the type of the ${action} button in card ${i + 1}`).toBe('button');
      const name = screen.nameOf(button);
      expect(name.includes(word) && name.includes(habit.name), `the accessible name of the ${action} button in card ${i + 1} (“${name}”)`).toBe(true);
    }
  });
});

test('the summary table shows the number of habits and the total minutes', () => {
  const table = screen.$('#summary');
  expect(table, 'the table #summary').toBeTruthy();
  expect(table.tagName, 'the element #summary').toBe('TABLE');
  expect(table.querySelector('caption')?.textContent.trim() ?? '', 'the caption of #summary').toBeTruthy();
  expect(table.querySelectorAll('th[scope="col"]').length, 'header cells with scope="col"').toBeGreaterThanOrEqual(2);
  const numbers = [...table.querySelectorAll('td')].map((cell) => parseInt(cell.textContent, 10));
  const total = scope.habits.reduce((sum, habit) => sum + habit.minutes, 0);
  expect(numbers, `the numbers in the cells of #summary (habits: ${scope.habits.length}, minutes: ${total})`).toContain(scope.habits.length);
  expect(numbers, `the numbers in the cells of #summary (habits: ${scope.habits.length}, minutes: ${total})`).toContain(total);
});

// ---------- styles ----------
test('the cards are a Grid or Flexbox layout with one column at 320px and two or more at 760px', async () => {
  expect(['grid', 'inline-grid', 'flex', 'inline-flex'], 'the display of #habits').toContain(getComputedStyle(screen.$('#habits')).display);
  expect(cards().length >= 2, 'at least two cards on the page').toBe(true);
  const narrow = await measureAt(320);
  expect(narrow.columns, 'columns of cards in a 320px window').toBe(1);
  expect(narrow.overflow, 'horizontal scrolling in a 320px window').toBe(false);
  expect((await measureAt(760)).columns, 'columns of cards in a 760px window').toBeGreaterThanOrEqual(2);
});

test('custom properties define the spacing and the list layout uses them', () => {
  const rules = allRules().filter((rule) => rule.style);
  const defines = rules.some((rule) => [...rule.style].some((property) => property.startsWith('--')));
  expect(defines, 'a rule that defines a custom property (--…)').toBe(true);
  const list = screen.$('#habits');
  const card = cards()[0];
  const uses = rules.some((rule) => rule.style.cssText.includes('var(--') && rule.selectorText
    && (list.matches(rule.selectorText) || (card && card.matches(rule.selectorText))));
  expect(uses, 'a rule for #habits or its cards that uses var(--…)').toBe(true);
});

test('cards use border-box sizing and the body text has a line-height of at least 1.4', () => {
  expect(getComputedStyle(cards()[0]).boxSizing, 'the box-sizing of a card').toBe('border-box');
  const body = getComputedStyle(document.body);
  const ratio = parseFloat(body.lineHeight) / parseFloat(body.fontSize);
  expect(ratio >= 1.4, `the body line-height divided by its font-size (${body.lineHeight} / ${body.fontSize})`).toBe(true);
});

test('cards move only when the person has not asked to reduce motion', () => {
  const card = cards()[0];
  expect(withMotionPreference('no-preference', () => animates(card)), 'a transition or animation on a card with no motion preference').toBe(true);
  expect(withMotionPreference('reduce', () => animates(card)), 'a transition or animation on a card with reduced motion').toBe(false);
});

// ---------- behaviour, keyboard only ----------
test('Enter in the form adds a habit and the default action is prevented', async () => {
  const before = cards().length;
  await fillForm(L.added, 15);
  await user.press('Enter', screen.$('#minutes'));
  expect(cards(), 'the cards after Enter in the form').toHaveLength(before + 1);
  expect(cards().at(-1), 'the last card').toHaveTextContent(L.added);
  await fillForm(L.added2, 5);
  const { prevented } = await user.submit(screen.$('#habit-form'));
  expect(prevented, 'event.preventDefault() in the submit listener').toBe(true);
  expect(cards(), 'the cards after a second submit').toHaveLength(before + 2);
});

test('a name with markup is shown as text', async () => {
  const name = '<img src="x" onerror="window.jsllMarkupRan = true">';
  await fillForm(name, 10);
  await user.press('Enter', screen.$('#name'));
  await sleep(50);
  expect(screen.$('#habits img'), 'an <img> element made from the name').toBeNull();
  expect(cards().some((card) => card.textContent.includes(name)), 'a card that shows the name as text').toBe(true);
  expect(window.jsllMarkupRan, 'code from the name').toBeUndefined();
});

test('invalid input shows messages next to the fields, adds nothing and focuses the first invalid field', async () => {
  const before = cards().length;
  await user.clear(screen.$('#name'));
  await user.fill(screen.$('#minutes'), '0');
  await user.submit(screen.$('#habit-form'));
  expect(cards(), 'the cards after an invalid submit').toHaveLength(before);
  expect(describedText(screen.$('#name')), 'the message tied to #name by aria-describedby').toBeTruthy();
  expect(describedText(screen.$('#minutes')), 'the message tied to #minutes by aria-describedby').toBeTruthy();
  expect(screen.$('#name'), 'the field #name').toHaveFocus();
  await fillForm(L.added3, 30);
  await user.submit(screen.$('#habit-form'));
  expect(cards(), 'the cards after a valid submit').toHaveLength(before + 1);
  expect(describedText(screen.$('#name')), 'the message tied to #name after a valid submit').toBe('');
  expect(describedText(screen.$('#minutes')), 'the message tied to #minutes after a valid submit').toBe('');
});

test('Edit with the keyboard fills the form and the next submit updates the same habit', async () => {
  const before = cards().length;
  const id = cards()[0].dataset.id;
  const edit = buttonIn(cards()[0], 'edit');
  edit.focus();
  await user.press('Enter', edit);
  expect(screen.$('#name'), 'the field #name after Edit').toHaveValue(scope.habits.find((habit) => habit.id === id).name);
  expect(screen.$('#name'), 'the field #name after Edit').toHaveFocus();
  await user.fill(screen.$('#name'), L.renamed);
  await user.press('Enter', screen.$('#name'));
  expect(cards(), 'the cards after saving the edit').toHaveLength(before);
  expect(cardOf(id), `the card ${id} after saving the edit`).toHaveTextContent(L.renamed);
});

test('Delete with the keyboard removes one habit and moves the focus to the next Delete button', async () => {
  const before = cards().length;
  const nextId = cards()[1].dataset.id;
  const remove = buttonIn(cards()[0], 'delete');
  remove.focus();
  await user.press('Enter', remove);
  expect(cards(), 'the cards after one Delete').toHaveLength(before - 1);
  expect(scope.habits, 'the habits after one Delete').toHaveLength(before - 1);
  expect(buttonIn(cardOf(nextId), 'delete'), 'the Delete button of the next habit').toHaveFocus();
});
