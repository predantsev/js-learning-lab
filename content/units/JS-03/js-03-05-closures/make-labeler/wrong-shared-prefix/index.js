// One prefix variable shared by every labeler: the last call of makeLabeler wins.
let currentPrefix = "";

function makeLabeler(prefix) {
  currentPrefix = prefix;
  return (record) => currentPrefix + record.name;
}

const headphones = { name: "%%headphones%%", acquired: false };
const mug = { name: "%%mug%%", acquired: true };

const wantLabel = makeLabeler("%%wantPrefix%%");
const haveLabel = makeLabeler("%%havePrefix%%");

console.log(wantLabel(headphones));
console.log(haveLabel(mug));
