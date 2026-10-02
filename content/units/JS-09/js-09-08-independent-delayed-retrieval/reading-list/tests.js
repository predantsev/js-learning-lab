// Reference versions of the three modules (the learner never sees them). Placeholder text is filled
// in from L at check time, so the reference page matches the learner's MARKUP.
const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const REFERENCE = {
  'books.js': fill("// The rules of the reading list: pure functions, no page and no storage.\n// A book: { id: \"b-1\", title: \"\u2026\", status: \"to-read\" | \"reading\" | \"done\" }.\n\n// A new list with the book added at the end. The list passed in is not changed.\nexport function addBook(books, book) {\n  return [...books, book];\n}\n\n// A new list in which the book with this id is replaced by a copy with the changes applied.\n// The other books stay the same objects. The list passed in is not changed.\nexport function updateBook(books, id, changes) {\n  return books.map((book) => (book.id === id ? { ...book, ...changes } : book));\n}\n\n// A new list without the book with this id. The list passed in is not changed.\nexport function removeBook(books, id) {\n  return books.filter((book) => book.id !== id);\n}\n\n// The books with the given status, in their order. The status \"all\" gives every book.\nexport function booksWithStatus(books, status) {\n  if (status === \"all\") return [...books];\n  return books.filter((book) => book.status === status);\n}\n"),
  'storage.js': fill("export const STORAGE_KEY = \"jsll.reading.v1\";\nconst STATUSES = [\"to-read\", \"reading\", \"done\"];\n\n// Saves the books as JSON text { \"schemaVersion\": 1, \"books\": [ \u2026 ] } under STORAGE_KEY.\nexport function saveBooks(storage, books) {\n  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, books }));\n}\n\nfunction isBook(value) {\n  return (\n    value !== null &&\n    typeof value === \"object\" &&\n    typeof value.id === \"string\" &&\n    typeof value.title === \"string\" &&\n    value.title.trim() !== \"\" &&\n    STATUSES.includes(value.status)\n  );\n}\n\n// Reads the books back. Gives [] when nothing is saved, when the text is not valid JSON,\n// when schemaVersion is not 1 or when books is not an array. Leaves out every record that is\n// not an object with a string id, a title that is not empty after trimming and a known status.\n// Never throws.\nexport function loadBooks(storage) {\n  const text = storage.getItem(STORAGE_KEY);\n  if (text === null) return [];\n  let data;\n  try {\n    data = JSON.parse(text);\n  } catch (error) {\n    return [];\n  }\n  if (data === null || typeof data !== \"object\" || data.schemaVersion !== 1 || !Array.isArray(data.books)) {\n    return [];\n  }\n  return data.books.filter(isBook);\n}\n"),
  'ui.js': fill("import { addBook } from \"./books.js\";\nimport { loadBooks, saveBooks } from \"./storage.js\";\n\n// The page of the reading list. Keep it as it is: the checks look for these elements.\nexport const MARKUP = `\n  <h1>%%heading%%</h1>\n  <form class=\"add-book\">\n    <label>%%titleLabel%% <input name=\"title\" autocomplete=\"off\"></label>\n    <button type=\"submit\">%%addButton%%</button>\n  </form>\n  <ul class=\"books\"></ul>\n`;\n\nconst STATUS_TEXT = { \"to-read\": \"%%toRead%%\", reading: \"%%reading%%\", done: \"%%done%%\" };\n\n// Shows the books in the list inside root, one item per book.\nexport function renderList(root, books) {\n  const list = root.querySelector(\".books\");\n  list.replaceChildren();\n  for (const book of books) {\n    const item = document.createElement(\"li\");\n    item.textContent = `${book.title} \u00b7 ${STATUS_TEXT[book.status]}`;\n    list.append(item);\n  }\n}\n\n// A \"b-<number>\" id that no book in the list has yet.\nfunction nextId(books) {\n  let n = books.length + 1;\n  while (books.some((book) => book.id === `b-${n}`)) n += 1;\n  return `b-${n}`;\n}\n\n// Puts MARKUP into root, shows the books saved in storage, and handles adding a book:\n// one submit listener on root (not on the form) adds a book with the trimmed title\n// (1 to 80 characters, otherwise nothing is added), the status \"to-read\" and an id no other\n// book has, then saves the list and shows it again.\nexport function mount(root, storage) {\n  root.innerHTML = MARKUP;\n  let books = loadBooks(storage);\n  renderList(root, books);\n  root.addEventListener(\"submit\", (event) => {\n    event.preventDefault();\n    const input = event.target.querySelector('input[name=\"title\"]');\n    const title = input.value.trim();\n    if (title === \"\" || title.length > 80) return;\n    books = addBook(books, { id: nextId(books), title, status: \"to-read\" });\n    saveBooks(storage, books);\n    renderList(root, books);\n    input.value = \"\";\n  });\n}\n"),
};
const swap = (path, from, to) => {
  if (!REFERENCE[path].includes(from)) throw new Error(`reference ${path} does not contain: ${from}`);
  return { ...REFERENCE, [path]: REFERENCE[path].replace(from, to) };
};
const BROKEN = {
  nullWhenEmpty: swap('storage.js', 'if (text === null) return [];', 'if (text === null) return null;'),
  mutatingAdd: swap('books.js', '  return [...books, book];', '  books.push(book);\n  return books;'),
  statusIgnored: swap('books.js', '  return books.filter((book) => book.status === status);', '  return [...books];'),
  throwsOnBadJson: swap('storage.js', '  let data;\n  try {\n    data = JSON.parse(text);\n  } catch (error) {\n    return [];\n  }', '  const data = JSON.parse(text);'),
  savesNothing: swap('storage.js', '  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, books }));', ''),
  submitAddsNothing: swap('ui.js', '    books = addBook(books, { id: nextId(books), title, status: "to-read" });', ''),
};

const moduleUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
const rewrite = (source, urls) => source.replace(/(["'])\.\/([\w./-]+)\1/g, (match, quote, path) => JSON.stringify(urls[path] ?? `~/${path}`));

// Runs books.test.js once more against the given versions of books.js, storage.js and ui.js.
async function runSuite(modules) {
  const source = files['books.test.js'];
  if (typeof source !== 'string') throw new Error('books.test.js is missing');
  const urls = { 'testing.js': moduleUrl(files['testing.js']) };
  for (const path of ['books.js', 'storage.js', 'ui.js']) urls[path] = moduleUrl(rewrite(modules[path], urls));
  const hidden = { test: window.test, expect: window.expect };
  delete window.test;
  delete window.expect;
  try {
    await import(moduleUrl(rewrite(source, urls)));
    const runner = await import(urls['testing.js']);
    return await runner.run({ print: false });
  } finally {
    Object.assign(window, hidden);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
async function expectSuitePasses() {
  const results = await runSuite(REFERENCE);
  expect(results.length, 'number of tests in books.test.js').toBeGreaterThan(0);
  expect(failing(results), 'your tests that fail with the reference modules').toEqual([]);
}
async function expectSuiteCatches(modules) {
  await expectSuitePasses();
  const results = await runSuite(modules);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken version').toBe(true);
}

// ---- the learner's own modules ----
const load = async (path, names) => {
  const mod = await import(`./${path}`);
  for (const name of names) expect(typeof mod[name], `type of the ${name} export of ${path}`).toBe('function');
  return mod;
};
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: (key) => { data.delete(key); },
    data,
  };
}
const KEY = 'jsll.reading.v1';
const sample = () => [
  { id: 'b-7', title: 'Atlas', status: 'done' },
  { id: 'b-8', title: 'Bridges', status: 'reading' },
  { id: 'b-9', title: 'Clocks', status: 'done' },
];
async function mounted(storage) {
  const { mount } = await load('ui.js', ['mount']);
  const root = document.createElement('div');
  document.body.append(root);
  mount(root, storage);
  return root;
}
const itemsOf = (root) => [...root.querySelectorAll('li')].map((item) => item.textContent);
async function submitTitle(root, form, title) {
  const input = form.querySelector('input[name="title"]');
  expect(input, 'the title field in the form').toBeTruthy();
  await user.fill(input, title);
  return user.submit(form);
}

test('addBook returns a new list with the book at the end', async () => {
  const { addBook } = await load('books.js', ['addBook']);
  const books = sample();
  const book = { id: 'b-10', title: 'Dunes', status: 'to-read' };
  const result = addBook(books, book);
  expect(result, 'addBook(books, book)').toEqual([...sample(), book]);
  expect(result === books, 'the same list came back').toBe(false);
  expect(books, 'the list passed in').toEqual(sample());
});

test('updateBook replaces one book with an updated copy', async () => {
  const { updateBook } = await load('books.js', ['updateBook']);
  const books = sample();
  const result = updateBook(books, 'b-8', { status: 'done' });
  expect(result, 'updateBook(books, "b-8", { status: "done" })').toEqual([sample()[0], { id: 'b-8', title: 'Bridges', status: 'done' }, sample()[2]]);
  expect(books[1].status, 'status of b-8 in the list passed in').toBe('reading');
  expect(result[0] === books[0], 'b-7 stays the same object').toBe(true);
});

test('removeBook leaves out the book with that id', async () => {
  const { removeBook } = await load('books.js', ['removeBook']);
  const books = sample();
  expect(removeBook(books, 'b-8').map((book) => book.id), 'ids after removeBook(books, "b-8")').toEqual(['b-7', 'b-9']);
  expect(books.length, 'length of the list passed in').toBe(3);
});

test('booksWithStatus keeps the books with the status, and all of them for all', async () => {
  const { booksWithStatus } = await load('books.js', ['booksWithStatus']);
  expect(booksWithStatus(sample(), 'done').map((book) => book.id), 'ids with status "done"').toEqual(['b-7', 'b-9']);
  expect(booksWithStatus(sample(), 'to-read'), 'books with status "to-read"').toEqual([]);
  expect(booksWithStatus(sample(), 'all'), 'books with status "all"').toEqual(sample());
  expect(booksWithStatus([], 'done'), 'an empty list').toEqual([]);
});

test('saveBooks writes schemaVersion 1 and the books under jsll.reading.v1', async () => {
  const { saveBooks } = await load('storage.js', ['saveBooks']);
  const storage = fakeStorage();
  saveBooks(storage, sample());
  const text = storage.getItem(KEY);
  expect(typeof text, 'type of the saved value under jsll.reading.v1').toBe('string');
  expect(JSON.parse(text), 'the saved JSON').toEqual({ schemaVersion: 1, books: sample() });
});

test('loadBooks gives [] for missing, unparsable or wrong-version data', async () => {
  const { loadBooks } = await load('storage.js', ['loadBooks']);
  expect(loadBooks(fakeStorage()), 'nothing saved').toEqual([]);
  expect(loadBooks(fakeStorage({ [KEY]: '{oops' })), 'text that is not JSON').toEqual([]);
  expect(loadBooks(fakeStorage({ [KEY]: JSON.stringify({ schemaVersion: 2, books: sample() }) })), 'schemaVersion 2').toEqual([]);
  expect(loadBooks(fakeStorage({ [KEY]: JSON.stringify({ schemaVersion: 1, books: 'none' }) })), 'books that is not an array').toEqual([]);
  expect(loadBooks(fakeStorage({ [KEY]: 'null' })), 'the JSON text null').toEqual([]);
  expect(loadBooks(fakeStorage({ [KEY]: JSON.stringify({ schemaVersion: 1, books: sample() }) })), 'valid saved books').toEqual(sample());
});

test('loadBooks leaves out invalid records', async () => {
  const { loadBooks } = await load('storage.js', ['loadBooks']);
  const stored = [sample()[0], null, { id: 5, title: 'Wrong id', status: 'done' }, { id: 'b-11', title: '  ', status: 'done' }, { id: 'b-12', title: 'Ok', status: 'lost' }, sample()[1]];
  expect(loadBooks(fakeStorage({ [KEY]: JSON.stringify({ schemaVersion: 1, books: stored }) })), 'books kept from mixed records').toEqual([sample()[0], sample()[1]]);
});

test('mount shows the books already in storage', async () => {
  const root = await mounted(fakeStorage({ [KEY]: JSON.stringify({ schemaVersion: 1, books: sample() }) }));
  try {
    const items = itemsOf(root);
    expect(items.length, 'list items after mount').toBe(3);
    expect(items[1], 'second list item').toMatch('Bridges');
  } finally {
    root.remove();
  }
});

test('submitting the form adds a book, shows it and saves it', async () => {
  const storage = fakeStorage();
  const root = await mounted(storage);
  try {
    const { prevented } = await submitTitle(root, root.querySelector('form'), `  ${L.book3}  `);
    expect(prevented, 'the submit default action was prevented').toBe(true);
    expect(itemsOf(root).length, 'list items after one add').toBe(1);
    expect(itemsOf(root)[0], 'the new list item').toMatch(L.book3);
    const saved = JSON.parse(storage.getItem(KEY) ?? 'null');
    expect(saved?.books?.length, 'books saved after one add').toBe(1);
    expect(saved.books[0], 'the saved book').toMatchObject({ title: L.book3, status: 'to-read' });
    await submitTitle(root, root.querySelector('form'), L.book1);
    const books = JSON.parse(storage.getItem(KEY)).books;
    expect(books.length, 'books saved after two adds').toBe(2);
    expect(books[0].id !== books[1].id, 'the two books have different ids').toBe(true);
  } finally {
    root.remove();
  }
});

test('a title of spaces adds nothing', async () => {
  const storage = fakeStorage();
  const root = await mounted(storage);
  try {
    await submitTitle(root, root.querySelector('form'), '    ');
    expect(itemsOf(root).length, 'list items after submitting spaces').toBe(0);
    const saved = storage.getItem(KEY);
    expect(saved === null || JSON.parse(saved).books.length === 0, 'nothing saved for a title of spaces').toBe(true);
  } finally {
    root.remove();
  }
});

test('a title longer than 80 characters adds nothing, and one of exactly 80 is added', async () => {
  const storage = fakeStorage();
  const root = await mounted(storage);
  try {
    await submitTitle(root, root.querySelector('form'), 'x'.repeat(81));
    expect(itemsOf(root).length, 'list items after submitting 81 characters').toBe(0);
    await submitTitle(root, root.querySelector('form'), 'y'.repeat(80));
    expect(itemsOf(root).length, 'list items after submitting exactly 80 characters').toBe(1);
  } finally {
    root.remove();
  }
});

test('the submit is handled by one listener on root', async () => {
  const root = await mounted(fakeStorage());
  try {
    // A copy of the form carries no listeners of its own: only a listener on root can handle it.
    const form = root.querySelector('form');
    const copy = form.cloneNode(true);
    form.replaceWith(copy);
    await submitTitle(root, copy, L.book2);
    expect(itemsOf(root).length, 'list items after submitting a re-created form').toBe(1);
  } finally {
    root.remove();
  }
});

test('your tests pass with the reference modules', async () => {
  await expectSuitePasses();
});

test('one of your tests fails when loadBooks gives null for empty storage', async () => {
  await expectSuiteCatches(BROKEN.nullWhenEmpty);
});

test('one of your tests fails when addBook changes the list it receives', async () => {
  await expectSuiteCatches(BROKEN.mutatingAdd);
});

test('one of your tests fails when booksWithStatus ignores the status', async () => {
  await expectSuiteCatches(BROKEN.statusIgnored);
});

test('one of your tests fails when loadBooks throws on text that is not JSON', async () => {
  await expectSuiteCatches(BROKEN.throwsOnBadJson);
});

test('one of your tests fails when saveBooks saves nothing', async () => {
  await expectSuiteCatches(BROKEN.savesNothing);
});

test('one of your tests fails when submitting the form adds no book', async () => {
  await expectSuiteCatches(BROKEN.submitAddsNothing);
});
