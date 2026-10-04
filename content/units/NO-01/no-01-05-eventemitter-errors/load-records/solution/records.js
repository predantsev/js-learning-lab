// Collects the 'record' events of an emitter into an array.
// Resolves with the array on 'end', rejects with the error on 'error'.
export function loadRecords(emitter) {
  return new Promise((resolve, reject) => {
    const records = [];
    const onRecord = (record) => records.push(record);
    const onEnd = () => {
      cleanup();
      resolve(records);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    // Remove exactly the three listeners this function added, and nobody else's.
    function cleanup() {
      emitter.off('record', onRecord);
      emitter.off('end', onEnd);
      emitter.off('error', onError);
    }
    emitter.on('record', onRecord);
    emitter.on('end', onEnd);
    emitter.on('error', onError);
  });
}
