// validateNoteInput on its own, then the API over real HTTP.
import { createApp } from './app.js';
import { validateNoteInput } from './validate.js';

const errorsOf = (input) => {
  expect(typeof validateNoteInput, 'type of validateNoteInput').toBe('function');
  const result = validateNoteInput(input);
  expect(result?.ok, `ok for ${JSON.stringify(input)}`).toBe(false);
  return result.errors ?? {};
};

test('a valid note is created from the parsed value', async () => {
  const base = await listen(createApp());
  const response = await request(`${base}/notes`, { method: 'POST', body: { title: `  ${L.films}  ` } });
  expect(response.status, 'status of POST /notes with a valid body').toBe(201);
  expect(response.json, 'the created note').toEqual({ id: 'n-3', title: L.films, text: '', pinned: false });
});

test('a missing or blank title is "required"', () => {
  expect(errorsOf({ text: 'a' }).title, 'errors.title without a title').toBe('required');
  expect(errorsOf({ title: '   ' }).title, 'errors.title for a blank title').toBe('required');
});

test('wrong types are rejected', () => {
  expect(errorsOf({ title: 42 }).title, 'errors.title for 42').toBe('notString');
  expect(errorsOf({ title: 'a', text: 7 }).text, 'errors.text for 7').toBe('notString');
  expect(errorsOf({ title: 'a', pinned: 'yes' }).pinned, 'errors.pinned for "yes"').toBe('notBoolean');
});

test('values over the limits are "tooLong"', () => {
  expect(validateNoteInput({ title: 'x'.repeat(60) })?.ok, 'ok for a 60-character title').toBe(true);
  expect(errorsOf({ title: 'x'.repeat(61) }).title, 'errors.title for 61 characters').toBe('tooLong');
  expect(validateNoteInput({ title: 'a', text: 'x'.repeat(500) })?.ok, 'ok for a 500-character text').toBe(true);
  expect(errorsOf({ title: 'a', text: 'x'.repeat(501) }).text, 'errors.text for 501 characters').toBe('tooLong');
});

test('an unknown field is rejected', () => {
  expect(errorsOf({ title: 'a', isAdmin: true }), 'errors for an extra isAdmin').toEqual({ isAdmin: 'unknownField' });
});

test('every error is collected, not only the first', () => {
  expect(errorsOf({ title: 42, text: 7, pinned: 'yes' }), 'errors for three bad fields').toEqual({ title: 'notString', text: 'notString', pinned: 'notBoolean' });
});

test('a body that is not an object is rejected', () => {
  for (const input of [undefined, null, [], 'note']) {
    expect(errorsOf(input), `errors for ${JSON.stringify(input) ?? 'undefined'}`).toEqual({ body: 'notObject' });
  }
});

test('create and replace answer 400 with the errors and store nothing', async () => {
  const base = await listen(createApp());
  const created = await request(`${base}/notes`, { method: 'POST', body: { title: '', pinned: 'yes' } });
  expect(created.status, 'status of POST /notes with a bad body').toBe(400);
  expect(created.json?.errors, 'errors of POST /notes').toEqual({ title: 'required', pinned: 'notBoolean' });
  const replaced = await request(`${base}/notes/n-1`, { method: 'PUT', body: { text: 'x' } });
  expect(replaced.status, 'status of PUT /notes/n-1 without a title').toBe(400);
  const list = await request(`${base}/notes`);
  expect(list.json?.length, 'notes after the bad POST').toBe(2);
  expect(list.json?.[0]?.title, 'title of n-1 after the bad PUT').toBe(L.gifts);
});

test('PATCH is validated too, and a bad patch changes nothing', async () => {
  const base = await listen(createApp());
  const bad = await request(`${base}/notes/n-1`, { method: 'PATCH', body: { pinned: 'yes' } });
  expect(bad.status, 'status of PATCH /notes/n-1 with pinned "yes"').toBe(400);
  const after = await request(`${base}/notes`);
  expect(after.json?.[0], 'n-1 after the bad PATCH').toEqual({ id: 'n-1', title: L.gifts, text: L.giftsText, pinned: false });
  const good = await request(`${base}/notes/n-1`, { method: 'PATCH', body: { pinned: true } });
  expect(good.status, 'status of PATCH /notes/n-1 with pinned true').toBe(200);
  expect(good.json, 'n-1 after the good PATCH').toEqual({ id: 'n-1', title: L.gifts, text: L.giftsText, pinned: true });
});
