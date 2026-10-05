// Same-project export for VS Code (REQ-012, V-06) and post-export reference archives (REQ-013).
// Builds the exported file set in memory: the learner's files unchanged, plus a manifest with
// per-file SHA-256, a README in the workspace language, a zero-dependency static server, the saved
// localStorage dataset and a page that restores it on the local origin. Shared by the platform UI
// (zip download, folder export) and the tests that unpack and run the result.
import { strToU8, zipSync } from 'fflate';
import { filesProblem, sortPaths, unifiedDiff } from './capstone.js';

export const MANIFEST_PATH = 'jsll-manifest.json';
export const EXPORT_FORMAT = 'jsll-export';
export const REFERENCE_FORMAT = 'jsll-reference';
export const FORMAT_VERSION = 1;
export const DEFAULT_LOCAL_PORT = 4300;
export const GENERATED_PATHS = { readme: 'README.md', pkg: 'package.json', serve: 'serve.mjs', storage: 'data/exported-storage.json', restore: 'tools/restore-data.html' };

const encoder = new TextEncoder();
export const byteLength = (text) => encoder.encode(text).length;

export async function sha256Hex(text) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Relative URL from one project file to another ("tools/a.html" → "data/b.json" = "../data/b.json"). */
export function relativeUrl(from, to) {
  const fromDir = from.split('/').slice(0, -1);
  const target = to.split('/');
  let common = 0;
  while (common < fromDir.length && common < target.length - 1 && fromDir[common] === target[common]) common += 1;
  return [...fromDir.slice(common).map(() => '..'), ...target.slice(common)].join('/') || to;
}

/**
 * Put a generated file where it does not touch a learner file: the learner always wins. A taken
 * name gets ".jsll" before its extension; a path through a learner *file* moves under "jsll-…".
 */
export function placeGenerated(desired, taken) {
  const lower = new Set([...taken].map((p) => p.toLowerCase()));
  const blockedFolder = (p) => p.split('/').slice(0, -1).some((_, i, parts) => lower.has(parts.slice(0, i + 1).join('/').toLowerCase()));
  const usedAsFolder = (p) => [...lower].some((t) => t.startsWith(`${p.toLowerCase()}/`));
  const free = (p) => !lower.has(p.toLowerCase()) && !blockedFolder(p) && !usedAsFolder(p);
  if (free(desired)) return desired;
  const slash = desired.lastIndexOf('/');
  const dir = slash >= 0 ? desired.slice(0, slash + 1) : '';
  const name = desired.slice(slash + 1);
  const dot = name.lastIndexOf('.');
  const renamed = `${dir}${dot > 0 ? `${name.slice(0, dot)}.jsll${name.slice(dot)}` : `${name}.jsll`}`;
  if (free(renamed)) return renamed;
  for (let i = 1; i < 50; i += 1) {
    const candidate = `jsll-export${i > 1 ? `-${i}` : ''}/${desired}`;
    if (free(candidate)) return candidate;
  }
  throw new Error(`no free path for the generated file ${desired}`);
}

// ---------- localized text of the generated files (follows the workspace language) ----------
const TEXT = {
  uk: {
    readmeIntro: 'Цей проєкт експортовано з js learning lab {date}. Тут ті самі файли, що були в платформі в момент експорту, разом із ще не збереженими змінами.',
    runTitle: 'Як запустити',
    run1: 'Потрібен Node.js 22.13 або новіший (той самий, що й для платформи). Перевір у терміналі: `node --version`.',
    run2: 'Відкрий цю теку у VS Code (File → Open Folder…), а потім термінал (Terminal → New Terminal).',
    run3: 'Виконай `{start}`. Встановлювати нічого не треба: у проєкту немає залежностей, тож `npm install` не потрібен.',
    run4: 'Відкрий адресу, яку покаже термінал: {url}',
    run5: 'Інший порт: `{startPort}`. Зупинити сервер: Ctrl+C у терміналі.',
    expectTitle: 'Що має бути',
    expect1: 'Та сама сторінка, що й у перегляді платформи: ті самі файли дають той самий результат.',
    expect2: 'Консоль браузера (F12 → Console) показує ті самі повідомлення, що й консоль платформи.',
    expect3: 'Сторінку треба відкривати через адресу з терміналу, а не подвійним кліком по index.html: модулі JavaScript не працюють через file://.',
    dataTitle: 'Збережені дані (localStorage)',
    dataBody: 'Дані браузера прив’язані до адреси сторінки, тому самі не переносяться. Файл `{storage}` містить записів зі сховища проєкту в платформі: {count}.',
    dataRestore: 'Щоб відновити їх, запусти проєкт, відкрий {restoreUrl} — на тій самій адресі й порту, що й проєкт, — і натисни «Відновити дані». Потім відкрий {url}.',
    filesTitle: 'Що в цій теці',
    filesLearner: 'Твої файли: {list}.',
    fileServe: '`{path}` — маленький локальний сервер без залежностей; працює лише на 127.0.0.1.',
    fileServeTs: 'Браузер не виконує TypeScript, тож `{path}` віддає файли `.ts` без типів (їх прибирає сам Node.js, як і платформа). Коли браузер уперше попросить файл `.ts`, Node.js один раз виведе попередження `ExperimentalWarning`: так і має бути.',
    filePkg: '`{path}` — команда `npm start`.',
    fileManifest: '`{path}` — опис експорту: проєкт, мова, версія вмісту курсу і SHA-256 кожного файла.',
    fileData: '`{storage}` і `{restore}` — дані сховища та сторінка, що відновлює їх у браузері.',
    fileRenamed: 'Файл `{path}` уже був у твоєму проєкті, тому службовий файл записано як `{as}`.',
    afterTitle: 'Після експорту',
    after1: 'Тепер головні — файли в цій теці. Платформа не читає й не змінює їх і нічого не синхронізує; копія в платформі лишається для вправ і порівняння.',
    after2: 'Для наступних кроків платформа дає окремі архіви-еталони та різницю між ними. Переносиш зміни ти, вручну:',
    merge1: 'Збережи копію своєї теки або зроби commit у Git.',
    merge2: 'Завантаж еталон потрібного кроку й розпакуй в окрему теку — не в цю.',
    merge3: 'Порівняй еталон зі своїми файлами (у VS Code: «Select for Compare», потім «Compare with Selected»).',
    merge4: 'Перенеси потрібні зміни вручну. Різниця між еталонами не описує твоїх власних правок.',
    merge5: 'Запусти проєкт і перевір результат.',
    troubleTitle: 'Якщо щось не так',
    trouble1: '`node: command not found` або `npm: command not found` — встанови Node.js з https://nodejs.org і відкрий новий термінал.',
    trouble2: '`Порт {port} уже зайнятий` — інша програма вже використовує порт: `{startPort}`.',
    trouble3: 'Порожня сторінка — відкрий адресу з терміналу (не файл напряму) і подивись помилки в консолі браузера.',
    serveRunning: 'Проєкт працює: {url}',
    serveRestore: 'Відновити збережені дані: {url}',
    serveStop: 'Зупинити: Ctrl+C',
    servePortBusy: 'Порт {port} уже зайнятий. Зупини іншу програму або обери інший порт: npm start -- --port {next}',
    serveBadPort: 'Неправильний порт «{port}». Вкажи ціле число від 1 до 65535, наприклад: npm start -- --port 4301',
    serveTsFailed: 'Не вдалося прибрати типи з {file}: {error}',
    serveTsUnsupported: 'Цей Node.js не вміє прибирати типи TypeScript, тож {file} не можна віддати браузеру. Потрібен Node.js 22.13 або новіший.',
    restoreTitle: 'Відновлення збережених даних',
    restoreIntro: 'Ця сторінка переносить дані сховища (localStorage), збережені в платформі, у браузер для цієї адреси. Твоїх файлів вона не змінює.',
    restoreOrigin: 'Дані буде записано для адреси {origin}. Відкривай проєкт на тій самій адресі й порту, інакше браузер їх не побачить.',
    restoreKey: 'Ключ',
    restoreValue: 'Значення',
    restoreState: 'Стан',
    restoreNew: 'буде додано',
    restoreReplace: 'замінить поточне значення',
    restoreSame: 'вже є',
    restoreButton: 'Відновити дані',
    restoreDone: 'Готово: записано {n}. Відкрий проєкт, щоб побачити ті самі дані.',
    restoreEmpty: 'У платформі сховище проєкту було порожнім — відновлювати нічого.',
    restoreFile: 'Цю сторінку відкрито як файл. Запусти проєкт командою npm start і відкрий її за адресою з терміналу.',
    restoreFailed: 'Не вдалося прочитати збережені дані: {error}',
    restoreBack: '← До проєкту',
    referenceTitle: 'Еталон: {name}',
    referenceIntro: 'Це окремий архів з еталонним станом проєкту «{project}» {when}. Його не треба розпаковувати поверх своєї теки: порівняй і перенеси потрібні зміни вручну.',
    referenceStart: 'на старті (CP-START)',
    referenceAfter: 'після кроку {unit}',
    referenceSteps: 'Що змінилося на цьому кроці',
    referenceDiff: 'Різниця з попереднім еталоном ({previous})',
    referenceNoDiff: 'Це перший еталон, порівнювати немає з чим.',
    referenceNote: 'Різниця описує лише зміни між еталонами, а не твої власні правки.',
  },
  en: {
    readmeIntro: 'This project was exported from js learning lab on {date}. These are the same files the platform had at that moment, including changes that were not saved yet.',
    runTitle: 'How to run it',
    run1: 'You need Node.js 22.13 or newer (the same as for the platform). Check in a terminal: `node --version`.',
    run2: 'Open this folder in VS Code (File → Open Folder…), then a terminal (Terminal → New Terminal).',
    run3: 'Run `{start}`. Nothing needs to be installed: the project has no dependencies, so `npm install` is not needed.',
    run4: 'Open the address the terminal prints: {url}',
    run5: 'Another port: `{startPort}`. Stop the server with Ctrl+C in the terminal.',
    expectTitle: 'What to expect',
    expect1: 'The same page as in the platform preview: the same files give the same result.',
    expect2: 'The browser console (F12 → Console) shows the same messages as the platform console.',
    expect3: 'Open the page through the address from the terminal, not by double-clicking index.html: JavaScript modules do not work over file://.',
    dataTitle: 'Saved data (localStorage)',
    dataBody: 'Browser data belongs to the page address, so it does not move by itself. `{storage}` holds the entries from the project storage in the platform: {count}.',
    dataRestore: 'To restore them, start the project, open {restoreUrl} — at the same address and port as the project — and press “Restore data”. Then open {url}.',
    filesTitle: 'What is in this folder',
    filesLearner: 'Your files: {list}.',
    fileServe: '`{path}` — a tiny local server with no dependencies; it listens on 127.0.0.1 only.',
    fileServeTs: 'Browsers do not run TypeScript, so `{path}` serves `.ts` files with their types removed (by Node.js itself, as in the platform). The first time the browser asks for a `.ts` file, Node.js prints an `ExperimentalWarning` once: that is expected.',
    filePkg: '`{path}` — the `npm start` command.',
    fileManifest: '`{path}` — what was exported: the project, language, course content version and the SHA-256 of every file.',
    fileData: '`{storage}` and `{restore}` — the saved storage data and the page that restores it in the browser.',
    fileRenamed: 'Your project already had `{path}`, so the platform file was written as `{as}`.',
    afterTitle: 'After the export',
    after1: 'From now on the files in this folder are the main version. The platform does not read or change them and syncs nothing; its copy stays for exercises and comparison.',
    after2: 'For later steps the platform offers separate reference archives and the differences between them. You move changes yourself, by hand:',
    merge1: 'Back up this folder or make a Git commit.',
    merge2: 'Download the reference of the step and unpack it into a separate folder — not into this one.',
    merge3: 'Compare the reference with your files (in VS Code: “Select for Compare”, then “Compare with Selected”).',
    merge4: 'Copy the changes you want by hand. The reference diff does not describe your own edits.',
    merge5: 'Run the project and check the result.',
    troubleTitle: 'If something goes wrong',
    trouble1: '`node: command not found` or `npm: command not found` — install Node.js from https://nodejs.org and open a new terminal.',
    trouble2: '`Port {port} is already in use` — another program uses the port: `{startPort}`.',
    trouble3: 'An empty page — open the address from the terminal (not the file directly) and look for errors in the browser console.',
    serveRunning: 'The project is running: {url}',
    serveRestore: 'Restore saved data: {url}',
    serveStop: 'Stop with Ctrl+C',
    servePortBusy: 'Port {port} is already in use. Stop the other program or choose another port: npm start -- --port {next}',
    serveBadPort: 'Invalid port "{port}". Use a whole number from 1 to 65535, for example: npm start -- --port 4301',
    serveTsFailed: 'Could not remove the types from {file}: {error}',
    serveTsUnsupported: 'This Node.js cannot remove TypeScript types, so {file} cannot be served to the browser. Node.js 22.13 or newer is needed.',
    restoreTitle: 'Restore saved data',
    restoreIntro: 'This page copies the storage data (localStorage) saved in the platform into this browser for this address. It does not change your files.',
    restoreOrigin: 'The data will be written for {origin}. Open the project at the same address and port, otherwise the browser will not see it.',
    restoreKey: 'Key',
    restoreValue: 'Value',
    restoreState: 'State',
    restoreNew: 'will be added',
    restoreReplace: 'replaces the current value',
    restoreSame: 'already there',
    restoreButton: 'Restore data',
    restoreDone: 'Done: {n} written. Open the project to see the same data.',
    restoreEmpty: 'The project storage in the platform was empty — there is nothing to restore.',
    restoreFile: 'This page was opened as a file. Start the project with npm start and open this page at the address from the terminal.',
    restoreFailed: 'Could not read the saved data: {error}',
    restoreBack: '← Back to the project',
    referenceTitle: 'Reference: {name}',
    referenceIntro: 'A separate archive with the reference state of the project “{project}” {when}. Do not unpack it over your own folder: compare and copy the changes you want by hand.',
    referenceStart: 'at the start (CP-START)',
    referenceAfter: 'after step {unit}',
    referenceSteps: 'What changes in this step',
    referenceDiff: 'Difference from the previous reference ({previous})',
    referenceNoDiff: 'This is the first reference; there is nothing to compare it with.',
    referenceNote: 'The diff only shows changes between references, not your own edits.',
  },
};
const fill = (text, params = {}) => Object.entries(params).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), text);
const formatDate = (date, lang) => new Intl.DateTimeFormat(lang === 'uk' ? 'uk-UA' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(date);

export function exportName(capstoneId) {
  return `js-learning-lab-${capstoneId}`;
}

// ---------- generated files ----------
export function serveScript(lang, { restorePath, port = DEFAULT_LOCAL_PORT }) {
  const T = TEXT[lang] ?? TEXT.en;
  const msg = (key) => JSON.stringify(T[key]);
  return `// Local static server for this exported project. No dependencies; Node.js 22.13 or newer.
// Serves only this folder and only on the loopback interface (127.0.0.1).
//   npm start                    → http://127.0.0.1:${port}/
//   npm start -- --port 4301     (or set the PORT environment variable)
import fs from 'node:fs/promises';
import http from 'node:http';
import nodeModule from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';
const RESTORE_PATH = ${JSON.stringify(restorePath)};
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};
const text = (template, params) => Object.entries(params).reduce((s, [k, v]) => s.split(\`{\${k}}\`).join(String(v)), template);

const args = process.argv.slice(2);
const flag = args.indexOf('--port');
const rawPort = flag >= 0 ? args[flag + 1] : process.env.PORT ?? '${port}';
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(text(${msg('serveBadPort')}, { port: rawPort }));
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  // Answer only to this computer's own addresses, so a web page cannot read these files by
  // pointing its own domain name at 127.0.0.1 (DNS rebinding).
  if (![\`\${HOST}:\${port}\`, \`localhost:\${port}\`].includes(String(req.headers.host).toLowerCase())) {
    res.writeHead(421, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Misdirected request');
    return;
  }
  try {
    const url = new URL(req.url, \`http://\${HOST}\`);
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    // Never serve anything outside this folder, and no hidden files (.git, .env …).
    const file = path.resolve(ROOT, \`.\${path.posix.normalize(rel)}\`);
    if (!file.startsWith(ROOT + path.sep) || rel.split('/').some((part) => part.startsWith('.'))) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    let body = await fs.readFile(file);
    let type = TYPES[ext] ?? 'application/octet-stream';
    // Browsers do not run TypeScript: as in the platform, a .ts file is served with its types removed
    // (Node.js 22.13 or newer; it prints an ExperimentalWarning once).
    if (ext === '.ts' || ext === '.mts') {
      const shown = path.relative(ROOT, file).split(path.sep).join('/');
      if (typeof nodeModule.stripTypeScriptTypes !== 'function') {
        console.error(text(${msg('serveTsUnsupported')}, { file: shown }));
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(text(${msg('serveTsUnsupported')}, { file: shown }));
        return;
      }
      try {
        body = nodeModule.stripTypeScriptTypes(body.toString('utf8'));
      } catch (error) {
        console.error(text(${msg('serveTsFailed')}, { file: shown, error: error.message }));
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(text(${msg('serveTsFailed')}, { file: shown, error: error.message }));
        return;
      }
      type = 'text/javascript; charset=utf-8';
    }
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const missing = ['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code);
    // The browser asks for /favicon.ico by itself; without one it gets an empty answer, not a 404
    // in the console that the project never caused.
    if (missing && req.url.split('?')[0] === '/favicon.ico') {
      res.writeHead(204, { 'cache-control': 'no-store' });
      res.end();
      return;
    }
    res.writeHead(missing ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(missing ? 'Not found' : 'Server error');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') console.error(text(${msg('servePortBusy')}, { port, next: port + 1 }));
  else console.error(error.message);
  process.exit(1);
});

server.listen(port, HOST, () => {
  const origin = \`http://\${HOST}:\${port}\`;
  console.log(text(${msg('serveRunning')}, { url: \`\${origin}/\` }));
  console.log(text(${msg('serveRestore')}, { url: \`\${origin}/\${RESTORE_PATH}\` }));
  console.log(${msg('serveStop')});
});
`;
}

export function packageJson({ capstoneId, title, servePath }) {
  return `${JSON.stringify({
    name: exportName(capstoneId),
    version: '1.0.0',
    private: true,
    description: `${title} — exported from js learning lab`,
    type: 'module',
    scripts: { start: `node ${servePath}` },
    engines: { node: '>=22.13' },
  }, null, 2)}\n`;
}

export function storageFile({ storage, capstoneId, workspaceId, exportedAt }) {
  return `${JSON.stringify({
    format: 'jsll-storage',
    formatVersion: FORMAT_VERSION,
    exportedAt,
    capstoneId,
    workspaceId,
    note: 'localStorage of the project inside the platform at export time. Restore it with the restore page on the same address where the project runs.',
    localStorage: storage,
  }, null, 2)}\n`;
}

export function restorePage(lang, { title, dataUrl, projectUrl }) {
  const T = TEXT[lang] ?? TEXT.en;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const strings = Object.fromEntries(['restoreOrigin', 'restoreKey', 'restoreValue', 'restoreState', 'restoreNew', 'restoreReplace', 'restoreSame', 'restoreDone', 'restoreEmpty', 'restoreFile', 'restoreFailed'].map((k) => [k, T[k]]));
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(T.restoreTitle)} — ${esc(title)}</title>
<style>
  body { margin: 0; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; background: #f6f6f2; color: #1f2933; }
  main { max-width: 46rem; margin: 0 auto; padding: 2rem 1.25rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.95rem; }
  th, td { text-align: left; border-bottom: 1px solid #d5d9cc; padding: 0.4rem 0.5rem; vertical-align: top; }
  td code { word-break: break-all; }
  button { font: inherit; padding: 0.55rem 1.1rem; border-radius: 6px; border: 1px solid #1d6a45; background: #1d6a45; color: #fff; cursor: pointer; }
  button:disabled { opacity: 0.5; cursor: default; }
  #status:not(:empty) { padding: 0.6rem 0.8rem; border-radius: 6px; background: #e6f2ea; }
  #status.error { background: #fbe7e5; }
  :focus-visible { outline: 3px solid #1d6a45; outline-offset: 2px; }
</style>
</head>
<body>
<main>
  <h1>${esc(T.restoreTitle)}</h1>
  <p>${esc(T.restoreIntro)}</p>
  <p id="origin"></p>
  <div id="preview"></div>
  <p><button type="button" id="restore" disabled>${esc(T.restoreButton)}</button></p>
  <p id="status" role="status" aria-live="polite"></p>
  <p><a href="${esc(projectUrl)}">${esc(T.restoreBack)}</a></p>
</main>
<script type="module">
  const T = ${JSON.stringify(strings).replace(/</g, '\\u003c')};
  const DATA_URL = ${JSON.stringify(dataUrl)};
  const fill = (text, params) => Object.entries(params).reduce((s, [k, v]) => s.split('{' + k + '}').join(String(v)), text);
  const status = document.getElementById('status');
  const button = document.getElementById('restore');
  const preview = document.getElementById('preview');
  const say = (text, error = false) => { status.textContent = text; status.className = error ? 'error' : ''; };
  document.getElementById('origin').textContent = fill(T.restoreOrigin, { origin: location.origin });

  function render(entries) {
    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    for (const label of [T.restoreKey, T.restoreValue, T.restoreState]) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; head.append(th); }
    const body = table.createTBody();
    for (const [key, value] of entries) {
      const row = body.insertRow();
      const k = row.insertCell(); const code = document.createElement('code'); code.textContent = key; k.append(code);
      row.insertCell().textContent = value.length > 160 ? value.slice(0, 160) + '…' : value;
      const current = localStorage.getItem(key);
      row.insertCell().textContent = current === null ? T.restoreNew : current === value ? T.restoreSame : T.restoreReplace;
    }
    preview.replaceChildren(table);
  }

  if (location.protocol === 'file:') say(T.restoreFile, true);
  else {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const entries = Object.entries(data.localStorage ?? {}).filter(([, v]) => typeof v === 'string');
      if (entries.length === 0) preview.textContent = T.restoreEmpty;
      else {
        render(entries);
        button.disabled = false;
        button.addEventListener('click', () => {
          try {
            for (const [key, value] of entries) localStorage.setItem(key, value);
            render(entries);
            say(fill(T.restoreDone, { n: entries.length }));
          } catch (error) { say(fill(T.restoreFailed, { error: error.message }), true); }
        });
      }
    } catch (error) { say(fill(T.restoreFailed, { error: error.message }), true); }
  }
</script>
</body>
</html>
`;
}

export function readme(lang, info) {
  const T = TEXT[lang] ?? TEXT.en;
  const { title, date, learnerFiles, paths, renamed, storageCount, port = DEFAULT_LOCAL_PORT, npmStart } = info;
  const url = `http://127.0.0.1:${port}/`;
  const start = npmStart ? 'npm start' : `node ${paths.serve}`;
  const startPort = npmStart ? 'npm start -- --port 4301' : `node ${paths.serve} --port 4301`;
  const list = (items) => items.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const bullets = (items) => items.map((s) => `- ${s}`).join('\n');
  return `# ${title} — js learning lab

${fill(T.readmeIntro, { date: formatDate(date, lang) })}

## ${T.runTitle}

${list([T.run1, T.run2, fill(T.run3, { start }), fill(T.run4, { url }), fill(T.run5, { startPort })])}

## ${T.expectTitle}

${bullets([T.expect1, T.expect2, T.expect3])}

## ${T.dataTitle}

${fill(T.dataBody, { storage: paths.storage, count: storageCount })}
${fill(T.dataRestore, { restoreUrl: `${url}${paths.restore}`, url })}

## ${T.filesTitle}

${bullets([
    fill(T.filesLearner, { list: learnerFiles.map((f) => `\`${f}\``).join(', ') }),
    fill(T.fileServe, { path: paths.serve }),
    ...(learnerFiles.some((f) => /\.m?ts$/i.test(f)) ? [fill(T.fileServeTs, { path: paths.serve })] : []),
    fill(T.filePkg, { path: paths.pkg }),
    fill(T.fileManifest, { path: MANIFEST_PATH }),
    fill(T.fileData, { storage: paths.storage, restore: paths.restore }),
    ...renamed.map((r) => fill(T.fileRenamed, { path: r.path, as: r.writtenAs })),
  ])}

## ${T.afterTitle}

${T.after1}

${T.after2}

${list([T.merge1, T.merge2, T.merge3, T.merge4, T.merge5])}

## ${T.troubleTitle}

${bullets([T.trouble1, fill(T.trouble2, { port, startPort }), T.trouble3])}
`;
}

/**
 * Build the exported project.
 * @param {{ workspace: { id: string, capstoneId: string, files: Record<string,string>, storage?: Record<string,string>, lang?: string, steps?: Record<string, { state: string, source?: string }> }, title: string, contentVersion: string, platformVersion?: string | null, now?: Date }} options
 * @returns {Promise<{ name: string, files: Record<string,string>, manifest: Record<string, any>, manifestText: string, generated: string[] }>}
 *   `files` excludes the manifest (the folder endpoint writes it); a zip adds `manifestText` as MANIFEST_PATH.
 */
export async function buildProjectExport({ workspace, title, contentVersion, platformVersion = null, now = new Date() }) {
  const { id: workspaceId, capstoneId, files, storage = {}, lang = 'uk', steps = {} } = workspace;
  const problem = filesProblem(files);
  if (problem) throw new Error(`unsafe project path ${JSON.stringify(problem.path)} (${problem.code})`);
  if (Object.keys(files).some((p) => p.toLowerCase() === MANIFEST_PATH)) throw new Error(`${MANIFEST_PATH} is reserved for the export manifest`);
  const exportedAt = now.toISOString();
  const taken = new Set(Object.keys(files));
  const paths = {};
  const renamed = [];
  for (const [key, desired] of Object.entries(GENERATED_PATHS)) {
    const placed = placeGenerated(desired, taken);
    if (placed !== desired) renamed.push({ path: desired, writtenAs: placed });
    paths[key] = placed;
    taken.add(placed);
  }
  const learnerFiles = sortPaths(Object.keys(files));
  const generatedFiles = {
    [paths.readme]: readme(lang, { title, date: now, learnerFiles, paths, renamed, storageCount: Object.keys(storage).length, npmStart: paths.pkg === GENERATED_PATHS.pkg }),
    [paths.pkg]: packageJson({ capstoneId, title, servePath: paths.serve }),
    [paths.serve]: serveScript(lang, { restorePath: paths.restore }),
    [paths.storage]: storageFile({ storage, capstoneId, workspaceId, exportedAt }),
    [paths.restore]: restorePage(lang, { title, dataUrl: relativeUrl(paths.restore, paths.storage), projectUrl: relativeUrl(paths.restore, 'index.html') }),
  };
  const out = { ...files, ...generatedFiles };
  const entries = [];
  for (const path of Object.keys(out).sort()) entries.push({ path, bytes: byteLength(out[path]), sha256: await sha256Hex(out[path]) });
  const manifest = {
    format: EXPORT_FORMAT,
    formatVersion: FORMAT_VERSION,
    exportedAt,
    platform: 'js-learning-lab',
    platformVersion,
    capstoneId,
    workspaceId,
    contentVersion,
    language: lang,
    entry: 'index.html',
    steps: Object.fromEntries(Object.entries(steps).map(([unit, r]) => [unit, { state: r.state, source: r.source ?? null }])),
    generated: Object.values(paths).sort(),
    renamedGenerated: renamed,
    files: entries,
  };
  return { name: exportName(capstoneId), files: out, manifest, manifestText: `${JSON.stringify(manifest, null, 2)}\n`, generated: Object.values(paths) };
}

/** A post-export reference archive for one checkpoint (REQ-013): files, manifest and a change guide. */
export async function buildReferenceArchive({ capstoneId, projectTitle, unit, stepTitle, instructionsMd, files, previous, lang, contentVersion }) {
  const T = TEXT[lang] ?? TEXT.en;
  const name = unit === null ? 'CP-START' : unit;
  const when = unit === null ? T.referenceStart : fill(T.referenceAfter, { unit });
  const diff = previous ? unifiedDiff(previous.files, files, { fromLabel: previous.name, toLabel: name }) : '';
  const guide = `# ${fill(T.referenceTitle, { name: `${name}${stepTitle ? ` — ${stepTitle}` : ''}` })}

${fill(T.referenceIntro, { project: projectTitle, when })}

${instructionsMd ? `## ${T.referenceSteps}\n\n${instructionsMd.trim()}\n\n` : ''}## ${previous ? fill(T.referenceDiff, { previous: previous.name }) : T.referenceDiff.replace(/\s*\(.*\)/, '')}

${previous ? `${T.referenceNote}\n\n\`\`\`diff\n${diff.trim()}\n\`\`\`` : T.referenceNoDiff}
`;
  const entries = [];
  for (const path of Object.keys(files).sort()) entries.push({ path, bytes: byteLength(files[path]), sha256: await sha256Hex(files[path]) });
  const manifest = { format: REFERENCE_FORMAT, formatVersion: FORMAT_VERSION, capstoneId, reference: name, previous: previous?.name ?? null, language: lang, contentVersion, files: entries };
  const folder = `${exportName(capstoneId)}-reference-${name.toLowerCase()}`;
  const extra = { 'JSLL-REFERENCE.md': guide, 'jsll-reference.json': `${JSON.stringify(manifest, null, 2)}\n` };
  return { folder, files: { ...files, ...extra }, manifest, diff };
}

/** Zip a file set under one top-level folder (sorted entries, UTF-8 text). */
export function zipProject(folder, files, { mtime = new Date() } = {}) {
  const tree = {};
  for (const path of Object.keys(files).sort()) tree[`${folder}/${path}`] = strToU8(files[path]);
  return zipSync(tree, { level: 6, mtime });
}
