// A habit source (read-only): an EventEmitter that emits one 'record' event per habit on load().
import { EventEmitter } from 'node:events';

export function createHabitSource(today) {
  const source = new EventEmitter();
  source.today = today;
  source.load = (habits) => {
    for (const habit of habits) source.emit('record', habit);
  };
  return source;
}
