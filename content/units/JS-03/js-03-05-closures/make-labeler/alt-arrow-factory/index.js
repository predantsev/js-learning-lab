// The factory itself can be an arrow that returns an arrow.
const makeLabeler = (prefix) => (record) => prefix + record.name;

const headphones = { name: "%%headphones%%", acquired: false };
const mug = { name: "%%mug%%", acquired: true };

const wantLabel = makeLabeler("%%wantPrefix%%");
const haveLabel = makeLabeler("%%havePrefix%%");

console.log(wantLabel(headphones));
console.log(haveLabel(mug));
