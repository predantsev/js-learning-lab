// Real requests to the habit lab: node lab-client.mjs edit | show
//   edit — renames h-01 and pauses h-02 at the same time (two quick edits), then shows both habits;
//   show — shows h-01 and h-02 as the server answers GET /habits now.
import { pathToFileURL } from 'node:url';

const call = async (base, method, path, body) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(2000),
  });
  return { status: response.status, body: await response.json() };
};

export async function show(base) {
  const { body } = await call(base, 'GET', '/habits');
  const h01 = body.find((habit) => habit.id === 'h-01');
  const h02 = body.find((habit) => habit.id === 'h-02');
  return `h-01 name: ${h01.name} | h-02 active: ${h02.active}`;
}

export async function edit(base) {
  const answers = await Promise.all([
    call(base, 'PATCH', '/habits/h-01', { name: '%%newName%%' }),
    call(base, 'PATCH', '/habits/h-02', { active: false }),
  ]);
  return `PATCH h-01 → ${answers[0].status}, PATCH h-02 → ${answers[1].status}`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = `http://127.0.0.1:${process.env.PORT ?? 7340}`;
  const command = process.argv[2];
  if (command === 'edit') console.log(await edit(base));
  if (command === 'edit' || command === 'show') console.log(await show(base));
  else console.log('usage: node lab-client.mjs edit | show');
}
