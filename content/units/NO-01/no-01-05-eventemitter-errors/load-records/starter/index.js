// Read-only driver: a loader emits three wishes, one per turn of the loop, then 'end'.
import { EventEmitter } from 'node:events';
import { loadRecords } from './records.js';

const loader = new EventEmitter();
const wishes = [{ id: 'w-01', name: '%%headphones%%' }, { id: 'w-02', name: '%%lamp%%' }, { id: 'w-03', name: '%%bicycle%%' }];

const done = loadRecords(loader);
for (const [i, wish] of wishes.entries()) setTimeout(() => loader.emit('record', wish), i * 10);
setTimeout(() => loader.emit('end'), 40);

const records = await done;
console.log(`%%loaded%%: ${records.map((wish) => wish.name).join(', ')}`);
console.log(`%%listenersLeft%%: ${loader.listenerCount('record') + loader.listenerCount('end') + loader.listenerCount('error')}`);
