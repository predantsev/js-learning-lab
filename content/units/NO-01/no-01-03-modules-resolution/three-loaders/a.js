// An ES module has no `module` object; CommonJS gives every file one.
const loader = typeof module === 'undefined' ? 'ES module' : 'CommonJS';
export const label = `a.js → ${loader}`;
