// The whole record is added to the text instead of its name: "[object Object]".
function makeLabeler(prefix) {
  return (record) => prefix + record;
}

const headphones = { name: "%%headphones%%", acquired: false };
const mug = { name: "%%mug%%", acquired: true };

const wantLabel = makeLabeler("%%wantPrefix%%");
const haveLabel = makeLabeler("%%havePrefix%%");

console.log(wantLabel(headphones));
console.log(haveLabel(mug));
