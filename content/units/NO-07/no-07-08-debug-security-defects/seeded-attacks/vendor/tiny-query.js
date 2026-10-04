// A stand-in for the npm package "tiny-query" 1.4.1 (synthetic: the platform has no npm packages).
// parse() understands nested keys: "filter[category]=home" gives { filter: { category: 'home' } }.
// Known advisory: a key "__proto__[…]" writes into Object.prototype, the parent of every object.
export function parse(search) {
  const result = {};
  for (const pair of search.split('&')) {
    if (pair === '') continue;
    const [rawKey, value = ''] = pair.split('=').map(decodeURIComponent);
    const nested = /^([^[]+)\[([^\]]+)\]$/.exec(rawKey);
    if (nested) {
      result[nested[1]] ??= {};
      result[nested[1]][nested[2]] = value;
    } else {
      result[rawKey] = value;
    }
  }
  return result;
}
