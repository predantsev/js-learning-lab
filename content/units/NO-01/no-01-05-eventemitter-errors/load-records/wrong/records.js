// Misconception: an 'error' event nobody listens to is ignored. Without an 'error' listener,
// emit('error') throws the error at whoever emitted it, and the promise never settles.
export function loadRecords(emitter) {
  return new Promise((resolve) => {
    const records = [];
    const onRecord = (record) => records.push(record);
    const onEnd = () => {
      emitter.off('record', onRecord);
      emitter.off('end', onEnd);
      resolve(records);
    };
    emitter.on('record', onRecord);
    emitter.on('end', onEnd);
  });
}
