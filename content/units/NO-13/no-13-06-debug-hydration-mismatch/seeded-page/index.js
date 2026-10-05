// Diagnosis: fetch the page, compare it with the client render, search the initial data.
import { createSeededServer, clientRender, settings } from './app.js';

const server = createSeededServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/`, { signal: AbortSignal.timeout(2000) });
  const html = await response.text();
  const serverMarkup = html.match(/<div id="root">(.*?)<\/div>/s)[1];
  const data = JSON.parse(html.match(/type="application\/json">(.*?)<\/script>/s)[1]);
  const clientMarkup = clientRender(data);

  // 1. Mismatch: the first character where the two renders differ.
  let at = 0;
  while (at < serverMarkup.length && serverMarkup[at] === clientMarkup[at]) at += 1;
  console.log(at === serverMarkup.length && at === clientMarkup.length
    ? '%%noMismatch%%'
    : `%%mismatchAt%% ${at}: "${serverMarkup.slice(at - 10, at + 8)}" ≠ "${clientMarkup.slice(at - 10, at + 8)}"`);

  // 2. Secret: search the page for the token's value, not for the word "token".
  console.log(`syncToken %%inPage%%: ${html.includes(settings.syncToken)}`);
} finally {
  server.closeAllConnections();
  server.close();
}
