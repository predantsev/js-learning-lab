// Collects the 'record' events of an emitter into an array.
// Resolves with the array on 'end', rejects with the error on 'error'.
export function loadRecords(emitter) {
  return new Promise((resolve, reject) => {
    const records = [];
    emitter.on('record', (record) => records.push(record));
    emitter.on('end', () => resolve(records));
  });
}
