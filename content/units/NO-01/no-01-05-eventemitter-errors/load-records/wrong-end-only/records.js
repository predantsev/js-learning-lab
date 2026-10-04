// Misconception: cleanup belongs to the happy path. After 'error' the three listeners stay.
export function loadRecords(emitter) {
  return new Promise((resolve, reject) => {
    const records = [];
    const onRecord = (record) => records.push(record);
    const onEnd = () => {
      emitter.off('record', onRecord);
      emitter.off('end', onEnd);
      emitter.off('error', onError);
      resolve(records);
    };
    const onError = (error) => reject(error);
    emitter.on('record', onRecord);
    emitter.on('end', onEnd);
    emitter.on('error', onError);
  });
}
