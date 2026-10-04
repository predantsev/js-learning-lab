// The client adapter the habit tracker's page uses. Each method sends one request and keeps the
// server's answer in `habits`, the list the page shows.
export function createClient(base) {
  const habits = [];
  const call = async (method, path, body) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(2000),
    });
    return { status: response.status, body: await response.json() };
  };
  const keep = (habit) => {
    const index = habits.findIndex((item) => item.id === habit.id);
    if (index !== -1) habits[index] = habit;
  };
  return {
    habits,
    async load() {
      habits.splice(0, habits.length, ...(await call('GET', '/habits')).body);
    },
    async rename(id, name) {
      const answer = await call('PATCH', `/habits/${id}`, { name });
      if (answer.status === 200) keep(answer.body);
      return answer.status;
    },
    async pause(id) {
      const answer = await call('PATCH', `/habits/${id}`, { active: false });
      if (answer.status === 200) keep(answer.body);
      return answer.status;
    },
  };
}
