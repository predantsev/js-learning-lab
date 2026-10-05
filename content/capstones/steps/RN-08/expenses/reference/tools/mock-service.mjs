// The course's mock service: a tiny HTTP server with synthetic records for the native lessons.
// It has no dependencies. Start: node mock-service.mjs   Stop: Ctrl+C
// Options: --port 7310 (default)  ·  --host 127.0.0.1 (default; --host 0.0.0.0 opens it to your local network)
//
// GET /health                  → { "ok": true }
// GET /records/<collection>    → the records of wishlist | planner | habits | expenses   (?lang=uk|en, default uk)
// GET /timetable               → departures of a synthetic bus stop                       (?lang=uk|en)
// Switches for any GET, to rehearse failures:
//   ?delay=1500          answer after 1500 ms (at most 10000)
//   ?status=503          answer with that status (400–599) and { "error": … }
//   ?fail=2&key=k1       the first 2 requests with key k1 answer 503, the next ones succeed
//   ?invalid=1           answer 200 with a body of the wrong shape
//   ?hang=1              accept the request and never answer
import http from 'node:http';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const RECORDS = {
  wishlist: [
    { id: 'w-01', name: { uk: 'Навушники', en: 'Headphones' }, price: 80, acquired: false, category: { uk: 'Техніка', en: 'Tech' } },
    { id: 'w-02', name: { uk: 'Настільна лампа', en: 'Desk lamp' }, price: 45, acquired: false, category: { uk: 'Дім', en: 'Home' } },
    { id: 'w-03', name: { uk: 'Велосипед', en: 'Bicycle' }, price: 240, acquired: false, category: { uk: 'Спорт', en: 'Sport' } },
    { id: 'w-04', name: { uk: 'Книжка про JavaScript', en: 'A book about JavaScript' }, price: 25, acquired: true, category: { uk: 'Книжки', en: 'Books' } },
    { id: 'w-05', name: { uk: 'Квитки на концерт', en: 'Concert tickets' }, price: null, acquired: false, category: null },
    { id: 'w-06', name: { uk: 'Термочашка', en: 'Travel mug' }, price: 18, acquired: true, category: { uk: 'Дім', en: 'Home' } },
  ],
  planner: [
    { id: 't-01', title: { uk: 'Полити квіти', en: 'Water the plants' }, dueDate: '2026-03-02', done: false, priority: 'normal' },
    { id: 't-02', title: { uk: 'Здати книжки в бібліотеку', en: 'Return library books' }, dueDate: '2026-03-01', done: false, priority: 'high' },
    { id: 't-03', title: { uk: 'Написати бабусі', en: 'Write to grandma' }, dueDate: null, done: false, priority: 'low' },
    { id: 't-04', title: { uk: 'Оплатити інтернет', en: 'Pay the internet bill' }, dueDate: '2026-02-27', done: true, priority: 'high' },
    { id: 't-05', title: { uk: 'Записатися до стоматолога', en: 'Book a dentist visit' }, dueDate: '2026-03-10', done: false, priority: 'normal' },
    { id: 't-06', title: { uk: 'Розібрати шафу', en: 'Tidy the wardrobe' }, dueDate: '2026-03-05', done: true, priority: 'low' },
  ],
  habits: [
    { id: 'h-01', name: { uk: 'Ранкова зарядка', en: 'Morning exercise' }, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
    { id: 'h-02', name: { uk: 'Читати 20 хвилин', en: 'Read for 20 minutes' }, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
    { id: 'h-03', name: { uk: 'Пити воду', en: 'Drink water' }, frequency: 'daily', active: true, completions: ['2026-03-01'] },
    { id: 'h-04', name: { uk: 'Прибирання', en: 'Tidy up' }, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
    { id: 'h-05', name: { uk: 'Вчити англійські слова', en: 'Learn English words' }, frequency: 'daily', active: false, completions: ['2026-02-20'] },
    { id: 'h-06', name: { uk: 'Прогулянка', en: 'Go for a walk' }, frequency: 'daily', active: true, completions: [] },
  ],
  expenses: [
    { id: 'e-01', label: { uk: 'Продукти на тиждень', en: 'Weekly groceries' }, amountMinor: 84550, date: '2026-03-01', category: 'food' },
    { id: 'e-02', label: { uk: 'Проїзний', en: 'Transit pass' }, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
    { id: 'e-03', label: { uk: 'Кава з друзями', en: 'Coffee with friends' }, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
    { id: 'e-04', label: { uk: 'Лампочки', en: 'Light bulbs' }, amountMinor: 9990, date: '2026-02-27', category: 'home' },
    { id: 'e-05', label: { uk: 'Квитки в кіно', en: 'Cinema tickets' }, amountMinor: 30000, date: '2026-02-27', category: 'fun' },
    { id: 'e-06', label: { uk: 'Обід', en: 'Lunch' }, amountMinor: 21050, date: '2026-03-02', category: 'food' },
  ],
};

const TIMETABLE = [
  { id: 'd-01', route: '7', destination: { uk: 'Вокзал', en: 'Railway station' }, departs: '08:05' },
  { id: 'd-02', route: '12', destination: { uk: 'Парк', en: 'City park' }, departs: '08:12' },
  { id: 'd-03', route: '7', destination: { uk: 'Вокзал', en: 'Railway station' }, departs: '08:25' },
  { id: 'd-04', route: '3', destination: { uk: 'Університет', en: 'University' }, departs: '08:31' },
];

// { uk, en } values become the text of the requested language.
function localize(records, lang) {
  return records.map((record) => Object.fromEntries(Object.entries(record).map(([field, value]) =>
    [field, value !== null && typeof value === 'object' && 'uk' in value ? value[lang] : value])));
}

export function createMockService({ log = console.log } = {}) {
  const attempts = new Map(); // key → requests seen with that key (for ?fail=N&key=K)

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://mock.local');
    const query = url.searchParams;
    const lang = query.get('lang') === 'en' ? 'en' : 'uk';
    const from = request.socket.remoteAddress;
    let note = '';
    const send = (status, body) => {
      log(`[mock] ${request.method} ${url.pathname}${url.search} → ${status}${note} from ${from}`);
      response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(body));
    };

    if (request.method !== 'GET') return send(405, { error: 'only GET is supported' });
    if (query.get('hang') === '1') {
      log(`[mock] ${request.method} ${url.pathname}${url.search} → no answer (hang) from ${from}`);
      return; // never answer
    }
    const delay = Math.min(Number(query.get('delay')) || 0, 10_000);
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

    const fail = Number(query.get('fail')) || 0;
    if (fail > 0) {
      const key = query.get('key') ?? 'default';
      const attempt = (attempts.get(key) ?? 0) + 1;
      attempts.set(key, attempt);
      note = ` (attempt ${attempt} of key ${key})`;
      if (attempt <= fail) return send(503, { error: 'service unavailable (rehearsed failure)' });
    }
    const status = Number(query.get('status'));
    if (status >= 400 && status <= 599) return send(status, { error: `rehearsed status ${status}` });
    if (query.get('invalid') === '1') return send(200, { records: 'not-a-list' });

    if (url.pathname === '/health') return send(200, { ok: true });
    if (url.pathname === '/timetable') return send(200, localize(TIMETABLE, lang));
    const match = url.pathname.match(/^\/records\/([a-z]+)$/);
    if (match && RECORDS[match[1]]) return send(200, localize(RECORDS[match[1]], lang));
    return send(404, { error: 'unknown address' });
  });
}

// Runs only when started directly (node mock-service.mjs), not when another module imports it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const option = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`);
    return index > 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
  };
  const port = Number(option('port', '7310'));
  const host = option('host', '127.0.0.1');
  const server = createMockService();
  server.listen(port, host, () => {
    console.log(`Mock service listening on http://${host}:${port}`);
    if (host === '127.0.0.1' || host === 'localhost') {
      console.log('Only this computer can reach it (loopback).');
    } else {
      console.log('WARNING: other devices on your local network can reach it now. Stop it when you are done.');
      for (const addresses of Object.values(os.networkInterfaces())) {
        for (const address of addresses ?? []) {
          if (address.family === 'IPv4' && !address.internal) console.log(`  LAN address: http://${address.address}:${port}`);
        }
      }
    }
    console.log('Stop it with Ctrl+C.');
  });
  process.on('SIGINT', () => {
    server.closeAllConnections(); // also ends requests that were told to hang
    server.close(() => {
      console.log('Mock service stopped.');
      process.exit(0);
    });
  });
}
