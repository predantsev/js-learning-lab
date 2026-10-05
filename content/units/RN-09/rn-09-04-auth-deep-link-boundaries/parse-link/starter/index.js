// index.js: feeds a few incoming links to your parser. Do not edit.
import { parseIncomingLink } from './parseIncomingLink.ts';

const incoming = [
  'jsll-lab://records/habits/h-02',
  'https://lab.jsll.example/records/expenses/e-05?utm_source=mail',
  'jsll-lab://records/habits/h-02?sessionToken=tok_x',
  'https://lab.jsll.example.attacker.example/records/habits/h-02',
  'jsll-lab://records/habits/e-02',
  'jsll-lab://settings/reset',
  'not a link',
];

for (const url of incoming) {
  try {
    console.log(url, '→', JSON.stringify(parseIncomingLink(url)));
  } catch (error) {
    console.log(url, '→ threw', error.name);
  }
}
