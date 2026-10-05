// Builds the page with its initial-data script and shows what an HTML parser would make of it.
import { createElement as h, renderToString } from './mini-react.js';
import { WishList } from './WishList.js';
import { wishes } from './wishes.js';
import { config } from './config.js';

const SAFE = false;

function initialDataJson() {
  if (!SAFE) {
    // "The client needs the currency, so let us send the config along."
    return JSON.stringify({ items: wishes, config });
  }
  const items = wishes.map(({ id, name, acquired }) => ({ id, name, acquired }));
  return JSON.stringify({ items, currency: config.currency }).replaceAll('<', '\\u003c');
}

const html = `<div id="root">${renderToString(h(WishList, { items: wishes }))}</div>
<script id="initial-data" type="application/json">${initialDataJson()}</script>`;
console.log(html);

// An HTML parser ends a script's text at the first "</script" followed by whitespace, "/" or ">".
const open = html.indexOf('<script id="initial-data" type="application/json">') + '<script id="initial-data" type="application/json">'.length;
const end = html.slice(open).search(/<\/script[\s/>]/i);
const scriptText = html.slice(open, open + end);
console.log(`%%scriptText%%: ${scriptText}`);
console.log(`%%afterScript%%: ${html.slice(open + end + '</script>'.length) || '%%nothing%%'}`);
try {
  JSON.parse(scriptText);
  console.log('%%parseOk%%');
} catch (error) {
  console.log(`%%parseFailed%%: ${error.message}`);
}
console.log(`%%tokenInPage%%: ${html.includes(config.apiToken)}`);
console.log(`%%noteInPage%%: ${html.includes(wishes[0].notes)}`);
