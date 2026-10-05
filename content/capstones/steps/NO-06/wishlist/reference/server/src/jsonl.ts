// JSON lines: one record per line of JSON, so a big list can be written and read piece by piece instead
// of as one huge text. toJsonLines turns records into lines; splitLines turns arriving chunks back into
// numbered lines, keeping the unfinished end of a chunk until the next one arrives. writeJsonLines writes
// lines to any writable stream and respects its backpressure: when write() answers false, it waits for
// 'drain' (the line was queued, not lost — writing it again would write it twice).
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { rename, rm } from "node:fs/promises";
import { Readable } from "node:stream";
import type { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Wish } from "../../domain/wishes.ts";
import { ApiError } from "./api-errors.ts";

// The fields of a wish in a fixed order: the same record always gives the same line.
export function wishLine(wish: Wish): string {
  return JSON.stringify({ id: wish.id, name: wish.name, price: wish.price, acquired: wish.acquired, category: wish.category }) + "\n";
}

export async function* toJsonLines(wishes: Iterable<Wish>): AsyncGenerator<string> {
  for (const wish of wishes) {
    yield wishLine(wish);
  }
}

export async function writeJsonLines(lines: Iterable<string> | AsyncIterable<string>, writable: Writable): Promise<void> {
  for await (const line of lines) {
    if (!writable.write(line)) {
      await once(writable, "drain");
    }
  }
}

// Writes the wishes as JSON lines to destPath: first into destPath.tmp, renamed only after success. After
// an error or an abort the temp file is removed and an older destPath stays as it was — pipeline closes
// the streams, but deletes no files.
export async function exportToFile(wishes: Iterable<Wish>, destPath: string, signal?: AbortSignal): Promise<void> {
  const tempPath = `${destPath}.tmp`;
  try {
    await pipeline(Readable.from(toJsonLines(wishes)), createWriteStream(tempPath), { signal: signal });
    await rename(tempPath, destPath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
}

export type Line = { lineNumber: number; text: string };

// The lines of a byte stream, numbered from 1. A line longer than maxLineBytes, or more than maxBytes in
// all, is refused at once with a 413 instead of being collected in memory.
export async function* splitLines(chunks: AsyncIterable<Buffer | string>, limits: { maxLineBytes: number; maxBytes: number }): AsyncGenerator<Line> {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let rest = "";
  let lineNumber = 0;
  let total = 0;
  for await (const chunk of chunks) {
    const bytes = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    total += bytes.length;
    if (total > limits.maxBytes) {
      throw new ApiError(413, "PAYLOAD_TOO_LARGE", { maxBytes: limits.maxBytes }, { connection: "close" });
    }
    let text: string;
    try {
      text = decoder.decode(bytes, { stream: true });
    } catch {
      throw new ApiError(400, "MALFORMED_JSON", { line: lineNumber + 1 });
    }
    const lines = (rest + text).split("\n");
    rest = lines.pop() ?? "";
    if (Buffer.byteLength(rest) > limits.maxLineBytes) {
      throw new ApiError(413, "PAYLOAD_TOO_LARGE", { line: lineNumber + 1, maxLineBytes: limits.maxLineBytes }, { connection: "close" });
    }
    for (const line of lines) {
      lineNumber += 1;
      if (Buffer.byteLength(line) > limits.maxLineBytes) {
        throw new ApiError(413, "PAYLOAD_TOO_LARGE", { line: lineNumber, maxLineBytes: limits.maxLineBytes }, { connection: "close" });
      }
      yield { lineNumber: lineNumber, text: line };
    }
  }
  if (rest !== "") {
    yield { lineNumber: lineNumber + 1, text: rest }; // the last line without a newline
  }
}
