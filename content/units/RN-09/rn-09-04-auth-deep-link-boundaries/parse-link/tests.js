import { parseIncomingLink } from './parseIncomingLink.ts';

const parse = (url) => {
  try {
    return parseIncomingLink(url);
  } catch (error) {
    return { threw: error?.name ?? String(error) };
  }
};
const refused = (reason) => ({ ok: false, reason });

test('a record link on the custom scheme becomes a route', () => {
  expect(typeof parseIncomingLink, 'type of parseIncomingLink').toBe('function');
  expect(parse('jsll-lab://records/planner/t-05'), 'jsll-lab://records/planner/t-05').toEqual({ ok: true, route: { screen: 'record', capstone: 'planner', id: 't-05' } });
  expect(parse('jsll-lab://records/wishlist/w-03'), 'jsll-lab://records/wishlist/w-03').toEqual({ ok: true, route: { screen: 'record', capstone: 'wishlist', id: 'w-03' } });
});

test('a record link on the verified app link becomes the same route', () => {
  expect(typeof parseIncomingLink, 'type of parseIncomingLink').toBe('function');
  expect(parse('https://lab.jsll.example/records/expenses/e-04'), 'https://lab.jsll.example/records/expenses/e-04').toEqual({ ok: true, route: { screen: 'record', capstone: 'expenses', id: 'e-04' } });
  expect(parse('https://lab.jsll.example/records/habits/h-01?utm_source=mail'), 'an ordinary extra parameter').toEqual({ ok: true, route: { screen: 'record', capstone: 'habits', id: 'h-01' } });
});

test('text that is not a URL is refused as malformed', () => {
  expect(typeof parseIncomingLink, 'type of parseIncomingLink').toBe('function');
  expect(parse('records/planner/t-05'), '"records/planner/t-05"').toEqual(refused('malformed-url'));
  expect(parse(''), 'an empty string').toEqual(refused('malformed-url'));
});

test('a link from another scheme or host is refused', () => {
  expect(typeof parseIncomingLink, 'type of parseIncomingLink').toBe('function');
  for (const url of [
    'https://lab.jsll.example.attacker.example/records/planner/t-05',
    'https://attacker.example/lab.jsll.example/records/planner/t-05',
    'http://lab.jsll.example/records/planner/t-05',
    'other-app://records/planner/t-05',
  ]) {
    expect(parse(url), url).toEqual(refused('unknown-origin'));
  }
});

test('a link with a credential-like parameter is refused, whatever its case', () => {
  expect(typeof parseIncomingLink, 'type of parseIncomingLink').toBe('function');
  for (const url of [
    'jsll-lab://records/planner/t-05?token=tok_x',
    'jsll-lab://records/planner/t-05?access_token=tok_x',
    'https://lab.jsll.example/records/planner/t-05?SessionId=abc',
    'jsll-lab://records/planner/t-05?view=full&apiKey=k',
    'jsll-lab://records/planner/t-05?Password=1',
  ]) {
    expect(parse(url), url).toEqual(refused('credential-param'));
  }
});

test('a path that is not a record route is refused', () => {
  expect(typeof parseIncomingLink, 'type of parseIncomingLink').toBe('function');
  for (const url of [
    'jsll-lab://settings/reset',
    'jsll-lab://records/notes/t-05',
    'jsll-lab://records/planner',
    'jsll-lab://records/planner/t-05/delete',
    'https://lab.jsll.example/admin/records/planner/t-05',
  ]) {
    expect(parse(url), url).toEqual(refused('unknown-route'));
  }
});

test('an id that does not match its capstone is refused', () => {
  expect(typeof parseIncomingLink, 'type of parseIncomingLink').toBe('function');
  for (const url of [
    'jsll-lab://records/planner/e-05',
    'jsll-lab://records/planner/t-5',
    'jsll-lab://records/planner/t-055',
    'jsll-lab://records/planner/t-05%27%20OR%201',
    'jsll-lab://records/planner/%E0%A4%A',
  ]) {
    expect(parse(url), url).toEqual(refused('invalid-id'));
  }
});
