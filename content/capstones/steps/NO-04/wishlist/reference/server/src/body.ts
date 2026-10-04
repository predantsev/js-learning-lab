// Reading a request body for the /v1 API: at most maxBytes, as UTF-8 text, then JSON. Node has no
// req.body: the chunks are counted as they arrive. A body over the limit is read to its end but not kept
// (so the client still gets the 413 answer), then refused.
import type http from "node:http";
import { ApiError } from "./api-errors.ts";

export async function readBodyText(req: http.IncomingMessage, maxBytes: number): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size <= maxBytes) {
      chunks.push(chunk);
    }
  }
  if (size > maxBytes) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", { maxBytes: maxBytes });
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw new ApiError(400, "MALFORMED_JSON");
  }
}

// JSON.parse that answers 400 MALFORMED_JSON instead of throwing a SyntaxError (which would be a 500).
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "MALFORMED_JSON");
  }
}
