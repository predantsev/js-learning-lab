// The new data source: the same listRecords() as the fixture source, but over HTTP.
// Only reading is here; writing and checking the answers are the task of this lesson's exercise.
export function createHttpSource({ baseUrl }) {
  return {
    async listRecords() {
      const response = await fetch(`${baseUrl}/v1/records`, { signal: AbortSignal.timeout(2000) });
      return response.json();
    },
  };
}
