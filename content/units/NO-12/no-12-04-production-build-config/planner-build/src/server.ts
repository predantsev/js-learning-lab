// The planner service before this lesson: it reads process.env wherever a value is needed.
import http from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fixtures } from './tasks.ts';

export async function start(): Promise<http.Server> {
  const server = http.createServer(async (request, response) => {
    try {
      const file = path.join(process.env.DATA_DIR as string, 'tasks.json');
      await mkdir(path.dirname(file), { recursive: true });
      const text = await readFile(file, 'utf8').catch(() => JSON.stringify(fixtures));
      await writeFile(file, text);
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(text);
    } catch (error) {
      console.error(`500: ${(error as Error).message}`);
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'internal error' }));
    }
  });
  const port = Number(process.env.PORT ?? 7372);
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  return server;
}
