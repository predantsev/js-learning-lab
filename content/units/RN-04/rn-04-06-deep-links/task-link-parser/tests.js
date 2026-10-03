import { parseRecordLink } from './links.js';

const NOT_FOUND = { screen: 'NotFound' };
// Calls the parser and turns a thrown error into a visible value instead of failing the whole check.
function parse(url) {
  try {
    return parseRecordLink(url);
  } catch (error) {
    return `threw ${error.name}`;
  }
}

test('a valid link opens Detail with its id', () => {
  expect(parse('courselab://task/t-02'), 'courselab://task/t-02').toEqual({ screen: 'Detail', params: { id: 't-02' } });
  expect(parse('courselab://task/t-10'), 'courselab://task/t-10').toEqual({ screen: 'Detail', params: { id: 't-10' } });
});

test('an encoded id is decoded before it is checked', () => {
  expect(parse('courselab://task/t%2D05'), 'courselab://task/t%2D05').toEqual({ screen: 'Detail', params: { id: 't-05' } });
});

test('extra query params are not passed on', () => {
  expect(parse('courselab://task/t-02?utm=share&admin=1'), 'courselab://task/t-02?utm=share&admin=1').toEqual({ screen: 'Detail', params: { id: 't-02' } });
});

test('an id that breaks the id rule is not found', () => {
  for (const url of ['courselab://task/x-01', 'courselab://task/t-2', 'courselab://task/t-002', 'courselab://task/w-03', 'courselab://task/t-02/delete', 'courselab://task/..%2Fwish%2Fw-01']) {
    expect(parse(url), url).toEqual(NOT_FOUND);
  }
});

test('a missing id is not found', () => {
  for (const url of ['courselab://task/', 'courselab://task']) {
    expect(parse(url), url).toEqual(NOT_FOUND);
  }
});

test('a malformed link gives not found instead of an error', () => {
  for (const url of ['courselab://task/%E0%A4%A', 'not a link', '']) {
    expect(parse(url), url).toEqual(NOT_FOUND);
  }
});

test('another scheme or another place is not found', () => {
  for (const url of ['https://example.com/task/t-02', 'courselab://wish/t-02']) {
    expect(parse(url), url).toEqual(NOT_FOUND);
  }
});
