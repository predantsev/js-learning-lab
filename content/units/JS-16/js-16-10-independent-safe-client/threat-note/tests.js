// An HTML sink named as the API; a mention after "not"/"не"/"instead of"/"замість" ("textContent, not innerHTML") is fine.
const HTML_SINK = /(?<!(?:^|[\s,(])(?:not|never|instead of|rather than|не|ні|без|замість|а не)\s+)(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write)/i;
const TEXT_SINK = /textContent|createTextNode|text node|текстов/i;

function note() {
  const value = scope.THREAT_NOTE;
  expect(typeof value, 'type of THREAT_NOTE').toBe('object');
  return value;
}

test('names every untrusted source of the events page', () => {
  const sources = [...(note().untrustedSources ?? [])].sort();
  expect(sources, 'untrustedSources').toEqual(['fetched JSON', 'form field', 'localStorage']);
});

test('displays the title and the organizer name through a text sink', () => {
  const { sinks = {} } = note();
  for (const field of ['title', 'organizerName']) {
    expect(HTML_SINK.test(sinks[field] ?? ''), `sinks.${field} is not an HTML sink`).toBe(false);
    expect(TEXT_SINK.test(sinks[field] ?? ''), `sinks.${field} names a text sink`).toBe(true);
  }
});

test('checks the scheme before a link is made', () => {
  const link = note().sinks?.organizerLink ?? '';
  expect(HTML_SINK.test(link), 'sinks.organizerLink is not an HTML sink').toBe(false);
  expect(/protocol|https?:|scheme|схем/i.test(link), 'sinks.organizerLink says how the scheme is checked').toBe(true);
});

test('lists the one stored key with its storage, scope and lifetime', () => {
  const keys = note().storedKeys ?? [];
  expect(keys.map((entry) => [entry.key, entry.storage, entry.scope]), 'key, storage and scope of storedKeys').toEqual([['events.city', 'localStorage', 'origin']]);
  expect(typeof keys[0]?.lifetime === 'string' && keys[0].lifetime.trim().length > 0, 'the lifetime is described').toBe(true);
});

test('explains where a secret would live', () => {
  const text = note().secrets ?? '';
  expect(text.trim().length >= 40, 'secrets is at least a sentence (40 characters)').toBe(true);
  expect(/server|сервер/i.test(text), 'secrets names the server').toBe(true);
});
