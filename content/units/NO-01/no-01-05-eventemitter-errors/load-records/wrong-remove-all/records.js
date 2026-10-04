// Misconception: removeAllListeners cleans up "my" listeners. It removes every listener of those
// events, including the ones other parts of the program added.
export function loadRecords(emitter) {
  return new Promise((resolve, reject) => {
    const records = [];
    const finish = () => {
      emitter.removeAllListeners('record');
      emitter.removeAllListeners('end');
      emitter.removeAllListeners('error');
    };
    emitter.on('record', (record) => records.push(record));
    emitter.on('end', () => {
      finish();
      resolve(records);
    });
    emitter.on('error', (error) => {
      finish();
      reject(error);
    });
  });
}
