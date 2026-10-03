// index.js: a small demo of your adapters. Do not edit.
import { createMemoryStorage, createPriceFormat } from './adapters.ts';

const storage = createMemoryStorage();
await storage.setItem('jsll.wishlist.v1', '{"schemaVersion":1,"records":[]}');
console.log('stored:', await storage.getItem('jsll.wishlist.v1'));
console.log('missing:', await storage.getItem('jsll.planner.v1'));

const format = createPriceFormat('%%locale%%', '%%noPrice%%');
console.log('80 →', format.price(80));
console.log('null →', format.price(null));
