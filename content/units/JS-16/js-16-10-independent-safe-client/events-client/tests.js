const json = (status, body) => ({ status, body, headers: { 'content-type': 'application/json; charset=utf-8' } });
const PAGE = { status: 200, body: '<!doctype html><title>App</title><div id="root"></div>', headers: { 'content-type': 'text/html; charset=utf-8' } };

// Hidden fixtures: markup in titles, javascript: and data: links in several spellings.
const EVENTS = [
  { id: 'ev-1', title: L.poetryNight, city: 'lviv', organizer: { name: L.library, url: 'https://library.example/events' } },
  { id: 'ev-2', title: '<img src="x.svg" onerror="console.log(1)">', city: 'kyiv', organizer: { name: L.club, url: '  JavaScript:console.log(2)' } },
  { id: 'ev-3', title: `<b>${L.boardGames}</b>`, city: 'odesa', organizer: { name: L.cafe, url: 'data:text/html,<b>x</b>' } },
  { id: 'ev-4', title: L.walk, city: 'kyiv', organizer: { name: L.park, url: 'HTTP://Park.Example/Walk' } },
];

function parsed(text) {
  expect(typeof text, 'type of the address searchUrl returns').toBe('string');
  return new URL(text, location.href);
}

async function submitSearch(answer, { query = '', city = '' } = {}) {
  const server = mockFetch(() => answer);
  try {
    await user.fill(screen.$('#query'), query);
    await user.select(screen.$('#city'), city);
    await user.click(screen.byRole('button', { name: L.searchButton }));
    await waitFor(() => screen.$('#status').textContent !== L.loading && screen.$('#status').textContent !== '');
  } finally {
    server.restore();
  }
  return server.calls;
}

test('searchUrl encodes the query and the city and leaves out empty ones', () => {
  expect(typeof scope.searchUrl, 'type of searchUrl').toBe('function');
  const full = parsed(scope.searchUrl('/api/events', { query: L.trickyQuery, city: 'lviv' }));
  expect(full.pathname, 'the path').toBe('/api/events');
  expect(full.searchParams.get('q'), 'the q parameter').toBe(L.trickyQuery);
  expect(full.searchParams.get('city'), 'the city parameter').toBe('lviv');
  expect([...full.searchParams.keys()], 'parameter names').toEqual(['q', 'city']);
  const empty = parsed(scope.searchUrl('/api/events', { query: '', city: '' }));
  expect(empty.search, 'the query string with no filters').toBe('');
  expect(empty.hash, 'the fragment').toBe('');
});

test('loadEvents returns the events of a JSON answer and a failure otherwise, without throwing', async () => {
  expect(typeof scope.loadEvents, 'type of loadEvents').toBe('function');
  const outcomes = [];
  for (const answer of [json(200, EVENTS), json(404, { error: 'not found' }), PAGE, { networkError: true }]) {
    const server = mockFetch(() => answer);
    try {
      outcomes.push(await scope.loadEvents('/api/events'));
    } catch (error) {
      outcomes.push(`threw ${error.name}`);
    } finally {
      server.restore();
    }
  }
  expect(outcomes[0], 'the result for 200 JSON').toEqual({ ok: true, events: EVENTS });
  expect(outcomes[1]?.ok, 'ok for a 404').toBe(false);
  expect(outcomes[2]?.ok, 'ok for a 200 HTML page').toBe(false);
  expect(outcomes[3]?.ok, 'ok for a network failure').toBe(false);
});

test('renderEvents shows every title as text', () => {
  expect(typeof scope.renderEvents, 'type of renderEvents').toBe('function');
  scope.renderEvents(EVENTS);
  const titles = screen.$$('#events h3');
  expect(titles.map((title) => title.textContent), 'the titles on the page').toEqual(EVENTS.map((event) => event.title));
  expect(screen.$$('#events h3 *').length, 'elements inside the titles').toBe(0);
  expect(screen.$$('#events img, #events b').length, 'elements made from the data').toBe(0);
});

test('renderEvents links organizers only with http or https', () => {
  expect(typeof scope.renderEvents, 'type of renderEvents').toBe('function');
  scope.renderEvents(EVENTS);
  const links = screen.$$('#events a');
  expect(links.map((link) => link.textContent), 'organizers shown as links').toEqual([L.library, L.park]);
  expect(links.map((link) => new URL(link.href).protocol), 'schemes of the links').toEqual(['https:', 'http:']);
  expect(screen.text().includes(L.club) && screen.text().includes(L.cafe), 'organizers without a safe link are still named').toBe(true);
});

test('submitting the form requests the encoded search and shows the result', async () => {
  const calls = await submitSearch(json(200, EVENTS.slice(0, 2)), { query: L.trickyQuery, city: 'kyiv' });
  expect(calls.length, 'requests').toBe(1);
  const url = new URL(calls[0].url);
  expect(url.pathname, 'the requested path').toBe('/api/events');
  expect(url.searchParams.get('q'), 'the requested q').toBe(L.trickyQuery);
  expect(url.searchParams.get('city'), 'the requested city').toBe('kyiv');
  expect(screen.$$('#events h3').length, 'events on the page').toBe(2);
  expect(screen.$('#status').textContent, 'the status').toBe(`${L.found} 2`);
});

test('a 200 HTML fallback page shows the failure message and no events', async () => {
  await submitSearch(PAGE, { query: L.walk });
  expect(screen.$('#status').textContent, 'the status').toBe(L.loadFailed);
  expect(screen.$$('#events li').length, 'events on the page').toBe(0);
});

test('only the city preference is stored, and it comes back', async () => {
  localStorage.clear();
  await submitSearch(json(200, EVENTS), { query: L.walk, city: 'odesa' });
  expect(Object.keys(localStorage), 'keys in localStorage').toEqual(['events.city']);
  expect(localStorage.getItem('events.city'), 'the stored city').toBe('odesa');
  expect(typeof scope.restoreFilter, 'type of restoreFilter').toBe('function');
  screen.$('#city').value = '';
  localStorage.setItem('events.city', 'lviv');
  scope.restoreFilter();
  expect(screen.$('#city').value, 'the city after restoreFilter').toBe('lviv');
});
