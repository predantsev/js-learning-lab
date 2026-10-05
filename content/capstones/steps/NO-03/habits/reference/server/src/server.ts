// The records server: `npm start` (or `node src/server.ts`) in server/ starts it on 127.0.0.1 and the port
// from loadConfig (4311 by default, PORT changes it); Ctrl+C stops it cleanly. GET /records answers the
// stored habits as JSON; every other address is a JSON 404, another method on /records a JSON 405 with
// Allow. Every answer goes through sendJson. createRecordsServer only builds the server, so the checks
// can start it themselves; the part at the bottom runs only when this file is started with node.
import http from "node:http";
import { pathToFileURL } from "node:url";
import { loadConfig } from "./config.ts";
import type { HabitRepository } from "./fileRepository.ts";
import { openRepository } from "./open.ts";

// Sends `value` as a complete JSON answer: the status, Content-Type and Content-Length in bytes (a
// Ukrainian letter takes two), then the body.
export function sendJson(res: http.ServerResponse, status: number, value: unknown): void {
  const text = JSON.stringify(value);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(text));
  res.end(text);
}

// A server that is not listening yet. `log` gets one line per finished answer.
export function createRecordsServer(repository: HabitRepository, log: (line: string) => void = console.log): http.Server {
  return http.createServer(async (req, res) => {
    res.on("finish", () => log(`${req.method} ${req.url} → ${res.statusCode}`));
    try {
      const { pathname } = new URL(req.url ?? "/", "http://localhost");
      if (pathname !== "/records") {
        return sendJson(res, 404, { error: "not found" });
      }
      if (req.method !== "GET") {
        res.setHeader("allow", "GET");
        return sendJson(res, 405, { error: "method not allowed" });
      }
      sendJson(res, 200, await repository.list());
    } catch (error) {
      // The details go to the terminal, never to the client.
      console.error(error);
      if (res.headersSent) {
        res.end();
      } else {
        sendJson(res, 500, { error: "internal error" });
      }
    }
  });
}

// Runs only with `node src/server.ts` (npm start), not when another module imports this file.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = loadConfig(process.env);
  if (!config.ok) {
    for (const message of config.errors) {
      console.error(message);
    }
    process.exitCode = 1;
  } else {
    const { repository, removedTemps, seeded } = await openRepository(config.value);
    for (const name of removedTemps) {
      console.log(`Removed a temp file left by a crash: ${name}`);
    }
    if (seeded) {
      console.log(`Created the data file with the starting habits: ${repository.file}`);
    }
    const server = createRecordsServer(repository);
    server.listen(config.value.port, "127.0.0.1", () => {
      console.log(`Records server listening on http://127.0.0.1:${config.value.port}`);
      console.log("Stop it with Ctrl+C.");
    });
    process.on("SIGINT", () => {
      console.log("SIGINT received: closing the server…");
      server.close(() => console.log("Server closed. Bye."));
    });
  }
}
