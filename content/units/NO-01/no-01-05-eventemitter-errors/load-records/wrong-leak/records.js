// Misconception: listeners go away by themselves once the promise settles. They stay on the
// emitter, so every call of loadRecords adds three more.
export function loadRecords(emitter) {
  return new Promise((resolve, reject) => {
    const records = [];
    emitter.on('record', (record) => records.push(record));
    emitter.on('end', () => resolve(records));
    emitter.on('error', (error) => reject(error));
  });
}
