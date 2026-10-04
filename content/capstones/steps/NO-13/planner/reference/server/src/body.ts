// Reading a request body for the /v1 API: at most maxBytes, as UTF-8 text, then JSON. Node has no
// req.body. A declared Content-Length over the limit is refused before a byte is read (a fast path, not a
// protection: a chunked body declares no length); the real protection counts the bytes of every chunk
// and stops reading at the limit. Both answer 413 with Connection: close, so the connection is not kept
// open for the rest of a body nobody will read.
import type http from "node:http";
import { ApiError } from "./api-errors.ts";

function tooLarge(maxBytes: number): ApiError {
  return new ApiError(413, "PAYLOAD_TOO_LARGE", { maxBytes: maxBytes }, { connection: "close" });
}

export function readBodyText(req: http.IncomingMessage, maxBytes: number): Promise<string> {
  if (Number(req.headers["content-length"] ?? 0) > maxBytes) {
    return Promise.reject(tooLarge(maxBytes));
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const stop = () => {
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
    };
    function onData(chunk: Buffer): void {
      size += chunk.length;
      if (size > maxBytes) {
        stop();
        req.pause();
        reject(tooLarge(maxBytes));
        return;
      }
      chunks.push(chunk);
    }
    function onEnd(): void {
      stop();
      try {
        resolve(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
      } catch {
        reject(new ApiError(400, "MALFORMED_JSON"));
      }
    }
    function onError(error: Error): void {
      stop();
      reject(error);
    }
    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);
  });
}

// JSON.parse that answers 400 MALFORMED_JSON instead of throwing a SyntaxError (which would be a 500).
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "MALFORMED_JSON");
  }
}
