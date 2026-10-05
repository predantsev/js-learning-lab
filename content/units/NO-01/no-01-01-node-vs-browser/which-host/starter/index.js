// Read-only driver: asks detectHost about the real global object and about three hand-made ones.
import { detectHost } from './host.js';

console.log(`%%realLabel%%: ${detectHost()}`);

// Hand-made global objects: only the properties detectHost may look at.
const pageLike = { window: {}, document: {}, navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0)' } };
const olderNodeLike = { process: { versions: { node: '20.18.0' } } };
console.log(`%%pageLabel%%: ${detectHost(pageLike)}`);
console.log(`%%olderNodeLabel%%: ${detectHost(olderNodeLike)}`);
console.log(`%%emptyLabel%%: ${detectHost({})}`);
