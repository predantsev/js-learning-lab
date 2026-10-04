// An emitter that reports each wish as a 'record' event and then fails with an 'error' event.
import { EventEmitter } from 'node:events';

class RecordLoader extends EventEmitter {
  load(wishes) {
    for (const wish of wishes) this.emit('record', wish);
    this.emit('error', new Error('%%brokenFile%%'));
  }
}

const loader = new RecordLoader();
loader.on('record', (wish) => console.log(`%%gotWish%%: ${wish.name}`));

console.log('%%beforeLoad%%');
loader.load([{ name: '%%headphones%%' }, { name: '%%lamp%%' }]);
console.log('%%afterLoad%%');
