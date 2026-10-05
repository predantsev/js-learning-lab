// supplied.js (read-only): the README of a synthetic library and three capability requests.

// receipt-scanner (invented for the course): its README mixes the 2.x and 3.x lines.
export const readme = [
  { id: 'a', text: `%%ra%%` },
  { id: 'b', text: `%%rb%%` },
  { id: 'c', text: `%%rc%%` },
  { id: 'd', text: `%%rd%%` },
  { id: 'e', text: `%%re%%` },
  { id: 'f', text: `%%rf%%` },
];

// Routes: 'javascript' — no native capability is needed; 'built-in' — an API React Native itself has;
// 'library' — an existing library provides it; 'custom-module' — the team writes its own native module.
export const requests = {
  monthTotal: `%%reqTotal%%`,
  shareSummary: `%%reqShare%%`,
  scanReceipt: `%%reqScan%%`,
};
