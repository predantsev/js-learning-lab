// Another valid solution: once() for 'end' and 'error' (each removes itself), removeListener for
// the other two, and a settle() helper that runs on either outcome.
export function loadRecords(emitter) {
  return new Promise((resolve, reject) => {
    const records = [];
    const onRecord = (record) => {
      records.push(record);
    };
    const settle = (finish, value) => {
      emitter.removeListener('record', onRecord);
      emitter.removeListener('end', onEnd);
      emitter.removeListener('error', onError);
      finish(value);
    };
    const onEnd = () => settle(resolve, records);
    const onError = (error) => settle(reject, error);
    emitter.on('record', onRecord);
    emitter.once('end', onEnd);
    emitter.once('error', onError);
  });
}
