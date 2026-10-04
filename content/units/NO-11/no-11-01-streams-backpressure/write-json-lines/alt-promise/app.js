// Alternative: wait for 'drain' with a hand-made promise and for the end with the end() callback.
export async function writeJsonLines(records, writable) {
  for (const record of records) {
    if (!writable.write(JSON.stringify(record) + '\n')) {
      await new Promise((resolve) => writable.once('drain', resolve));
    }
  }
  await new Promise((resolve, reject) => {
    writable.once('error', reject);
    writable.end(resolve);
  });
}
