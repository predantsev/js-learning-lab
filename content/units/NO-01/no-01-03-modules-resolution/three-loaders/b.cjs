// A CommonJS file: it exports by assigning to `exports`, not with `export`.
const loader = typeof module === 'undefined' ? 'ES module' : 'CommonJS';
exports.label = `b.cjs → ${loader}`;
