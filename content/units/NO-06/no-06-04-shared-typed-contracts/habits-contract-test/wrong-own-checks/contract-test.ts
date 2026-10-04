// Mistake: writes its own field checks instead of using the shared schema, and checks fewer things.
export async function checkRecordsContract(base: string): Promise<string[]> {
  const response = await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) });
  if (response.status !== 200) return [`status ${response.status}`];
  const body: unknown = await response.json();
  if (!Array.isArray(body)) return ['body: expected a list'];
  const problems: string[] = [];
  body.forEach((habit, index) => {
    if (typeof habit.id !== 'string') problems.push(`${index}: id: expected a non-empty string`);
    if (typeof habit.active !== 'boolean') problems.push(`${index}: active: expected boolean`);
  });
  return problems;
}
