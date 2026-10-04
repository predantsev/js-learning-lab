// Structured logs: one JSON line per finished request, with exactly these fields and nothing else — no
// headers, no query, no body, so an expense's label or amount never reaches the log. The request id ties a
// log line to the answer the client got (the x-request-id header). An incoming X-Request-Id is untrusted
// input too: it is kept only when it has the right shape, otherwise the server makes its own.
import { randomUUID } from "node:crypto";
import type http from "node:http";

export type RequestLine = {
  time: string;
  level: "info" | "warn" | "error";
  requestId: string;
  method: string;
  route: string; // the pathname only, without the query
  status: number;
  durationMs: number;
};

// A failure inside: the error's name and code only — its message may hold data from a request or a file.
export type ErrorLine = { time: string; level: "error"; requestId: string; event: "failed"; error: string; code: string | null };

export type LogLine = RequestLine | ErrorLine;
export type Log = (line: LogLine) => void;

export const writeJsonLine: Log = (line) => console.log(JSON.stringify(line));

const WELL_FORMED_ID = /^[A-Za-z0-9-]{8,64}$/;

export function requestIdOf(req: http.IncomingMessage): string {
  const incoming = req.headers["x-request-id"];
  return typeof incoming === "string" && WELL_FORMED_ID.test(incoming) ? incoming : randomUUID();
}

// Up to 399 is info, 4xx warn, 5xx error.
export function levelFor(status: number): RequestLine["level"] {
  return status >= 500 ? "error" : status >= 400 ? "warn" : "info";
}

export function errorLine(requestId: string, error: unknown): ErrorLine {
  const { name, code } = (error ?? {}) as { name?: unknown; code?: unknown };
  return { time: new Date().toISOString(), level: "error", requestId: requestId, event: "failed", error: typeof name === "string" ? name : "unknown", code: typeof code === "string" ? code : null };
}
