import { createElement as h, renderToString } from './mini-react.js';
import { ReadingList } from './ReadingList.js';
import { createApp } from './app.js';
import { clientElement } from './client.js';
import { config } from './config.js';

// Fresh books inside the checks: a private note, a hostile title, & and a line separator.
const stored = () => [
  { id: 'b-11', title: L.book4, author: L.author4, status: 'done', ownerNote: L.note },
  { id: 'b-12', title: '</script><script>alert(2)</script> & \u2028', author: L.author3, status: 'reading', ownerNote: L.note },
];
const damaged = () => [{ id: 'b-19', title: null, author: L.author4, status: 'done', ownerNote: '' }];

async function start(loadBooks) {
  expect(typeof createApp, 'type of createApp').toBe('function');
  const entries = [];
  const base = await listen(createApp({ loadBooks, log: (entry) => entries.push(entry) }));
  return { base, entries };
}

async function page() {
  const { base } = await start(stored);
  const response = await request(`${base}/`);
  expect(response.status, 'status of GET /').toBe(200);
  const html = response.text;
  const markup = html.match(/<div id="root">(.*?)<\/div>\s*<script/s)?.[1];
  const json = html.match(/<script id="initial-data" type="application\/json">(.*?)<\/script>/s)?.[1];
  expect(markup, '<div id="root">…</div> followed by a <script> in the page').toBeDefined();
  expect(json, '<script id="initial-data" type="application/json"> in the page').toBeDefined();
  return { response, html, markup, json };
}

const publicBooks = () => stored().map(({ id, title, author, status }) => ({ id, title, author, status }));

test('GET / answers a UTF-8 HTML document', async () => {
  const { response, html } = await page();
  expect(response.headers['content-type'] ?? '', 'content-type of GET /').toMatch(/^text\/html/);
  expect(/^\s*<!doctype html>/i.test(html), 'the body starts with <!doctype html>').toBe(true);
  expect(/<meta charset="utf-8"\s*\/?>/i.test(html), '<meta charset="utf-8">').toBe(true);
});

test('#root holds the server render of the public books', async () => {
  const { markup } = await page();
  expect(markup, '#root').toBe(renderToString(h(ReadingList, { books: publicBooks(), filter: 'all' })));
});

test('the initial data holds exactly the public books and the filter', async () => {
  const { json } = await page();
  expect(JSON.parse(json), 'the parsed #initial-data').toEqual({ books: publicBooks(), filter: 'all' });
});

test('the initial data cannot close its script', async () => {
  const { json } = await page();
  expect(/[<>&\u2028\u2029]/.test(json), `a raw <, >, & or line separator in ${json}`).toBe(false);
});

test('no server setting reaches the page', async () => {
  const { html } = await page();
  expect(html.includes(config.apiToken), 'the apiToken value in the page').toBe(false);
  expect(html.includes('dataDir'), 'dataDir in the page').toBe(false);
});

test('the client render from the page data matches #root', async () => {
  const { markup, json } = await page();
  expect(typeof clientElement, 'type of clientElement').toBe('function');
  const element = clientElement(JSON.parse(json));
  expect(element?.type, 'the component clientElement returns').toBe(ReadingList);
  expect(renderToString(element), 'the client render').toBe(markup);
});

test('the page loads /client.js as a module', async () => {
  const { html } = await page();
  const tag = (html.match(/<script\b[^>]*>/gi) ?? []).find((t) => /\bsrc="\/client\.js"/.test(t));
  expect(tag, 'a <script> with src="/client.js"').toBeDefined();
  expect(/\btype="module"/.test(tag), `type="module" on ${tag}`).toBe(true);
});

test('a render error answers a safe 500 and is logged with the request id', async () => {
  const { base, entries } = await start(damaged);
  const response = await request(`${base}/`, { headers: { 'x-request-id': 'req-lab-5' } });
  expect(response.status, 'status when the render throws').toBe(500);
  expect(response.text, 'body of the 500 answer').toContain('req-lab-5');
  expect(/trim|TypeError|null/.test(response.text), `error details in the 500 page: ${response.text}`).toBe(false);
  expect(entries.some((entry) => entry.requestId === 'req-lab-5'), 'a log entry with requestId "req-lab-5"').toBe(true);
});

test('a request id from the request is never echoed as markup', async () => {
  const { base } = await start(damaged);
  const response = await request(`${base}/`, { headers: { 'x-request-id': '<img src=x onerror=alert(3)>' } });
  expect(response.status, 'status when the render throws').toBe(500);
  expect(response.text.includes('<img'), `an <img> tag from the header in the 500 page: ${response.text}`).toBe(false);
});

test('the server keeps answering after a render error', async () => {
  let call = 0;
  const { base } = await start(() => (call++ === 0 ? damaged() : stored()));
  expect((await request(`${base}/`)).status, 'status of the failing request').toBe(500);
  expect((await request(`${base}/`)).status, 'status of the next request').toBe(200);
});

test('another address answers 404', async () => {
  const { base } = await start(stored);
  expect((await request(`${base}/books.json`)).status, 'status of GET /books.json').toBe(404);
});
