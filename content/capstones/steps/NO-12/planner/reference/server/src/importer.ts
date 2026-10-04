// The import of tasks from JSON lines: a bounded, cancellable job. The bytes flow through pipeline() —
// source → splitLines → check every line — so a broken line, a limit or an abort closes every stage at
// once. Every line is checked by the storage contract, plus the edge rule that a due date names a day
// that exists (isRealDate, as POST and PUT check it) and the shape of the id; the problems are collected
// with their line numbers. Nothing reaches the store until the whole input has been read and is valid: a
// partial import cannot exist. Then all tasks are written in ONE change of the repository, an upsert by
// id: a task with a known id replaces the stored one (a done task stays done), a new id is added. So the
// same file imported twice gives the same store — a retried import never duplicates a task. Budget: at
// most maxRecords lines; between batches of lines the job yields to the event loop (setImmediate), so the
// server still answers other requests during a big import, and checks the signal at that safe point.
import { setImmediate as nextTurn } from "node:timers/promises";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import { isCalendarDate } from "../../domain/tasks.ts";
import type { Task } from "../../domain/tasks.ts";
import { ApiError } from "./api-errors.ts";
import { isRealDate } from "./config.ts";
import { checkRecords } from "./contract.ts";
import type { TaskRepository } from "./fileRepository.ts";
import { retry } from "./jobs.ts";
import { splitLines } from "./jsonl.ts";
import type { Line } from "./jsonl.ts";

export type ImportLimits = { maxRecords: number; maxLineBytes: number; maxBytes: number; batchSize: number };

export const IMPORT_LIMITS: ImportLimits = { maxRecords: 20_000, maxLineBytes: 4096, maxBytes: 8_000_000, batchSize: 500 };

export type ImportResult = { lines: number; created: number; updated: number };

const MAX_REPORTED = 20;

// One line → a checked task, or the problems of that line ("dueDate: notRealDate").
function checkLine(text: string, idPattern: RegExp): { task: Task } | { problems: string[] } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { problems: ["not-json"] };
  }
  const { problems, tasks } = checkRecords([value]);
  const own = problems.map((problem) => problem.replace(/^records\[0\]\.?:?\s?/, ""));
  const id = (value as { id?: unknown } | null)?.id;
  if (typeof id === "string" && !idPattern.test(id)) {
    own.push("id: malformed");
  }
  // The contract checks the form YYYY-MM-DD; the edge also refuses a day that does not exist (2026-02-31).
  const dueDate = (value as { dueDate?: unknown } | null)?.dueDate;
  if (isCalendarDate(dueDate) && !isRealDate(dueDate)) {
    own.push("dueDate: notRealDate");
  }
  return own.length > 0 ? { problems: own } : { task: tasks[0] };
}

export async function importJsonLines(source: Readable | AsyncIterable<Buffer | string>, repository: TaskRepository, options: { idPattern: RegExp; signal?: AbortSignal; limits?: Partial<ImportLimits> }): Promise<ImportResult> {
  const { maxRecords, maxLineBytes, maxBytes, batchSize } = { ...IMPORT_LIMITS, ...options.limits };
  const { signal } = options;
  const tasks = new Map<string, Task>();
  // No prototype: the keys are "line 3", but nothing from the input can reach the prototype.
  const problems: Record<string, string> = Object.create(null);
  let reported = 0;
  let more = 0;
  let count = 0;

  async function checkAll(lines: AsyncIterable<Line>): Promise<void> {
    for await (const { lineNumber, text } of lines) {
      if (text.trim() === "") {
        continue;
      }
      count += 1;
      if (count > maxRecords) {
        throw new ApiError(413, "PAYLOAD_TOO_LARGE", { maxRecords: maxRecords }, { connection: "close" });
      }
      const checked = checkLine(text, options.idPattern);
      const lineProblems = "problems" in checked ? checked.problems : tasks.has(checked.task.id) ? ["id: duplicate"] : [];
      if (lineProblems.length > 0) {
        if (reported < MAX_REPORTED) {
          problems[`line ${lineNumber}`] = lineProblems.join(", ");
          reported += 1;
        } else {
          more += 1;
        }
      } else if ("task" in checked) {
        tasks.set(checked.task.id, checked.task);
      }
      if (count % batchSize === 0) {
        await nextTurn(); // let the server answer other requests between batches
        signal?.throwIfAborted();
      }
    }
  }

  await pipeline(source, (chunks: AsyncIterable<Buffer | string>) => splitLines(chunks, { maxLineBytes: maxLineBytes, maxBytes: maxBytes }), checkAll, { signal: signal });
  signal?.throwIfAborted();
  if (reported > 0) {
    throw new ApiError(400, "VALIDATION_FAILED", more > 0 ? { ...problems, more: more } : { ...problems });
  }
  // The write may fail for a passing reason (a busy disk); the upsert is idempotent, so it is retried.
  const { created, updated } = await retry(() => repository.upsertMany([...tasks.values()]), {
    maxAttempts: 3,
    baseMs: 50,
    isRetryable: (error) => !(error instanceof ApiError) && (error as Error).name !== "ContractError" && (error as Error).name !== "AbortError",
    signal: signal,
  });
  return { lines: count, created: created, updated: updated };
}
