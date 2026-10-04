// The /v1 records API of the wishlist — a versioned contract next to the unversioned GET /records of the
// previous step, which stays as it was published:
//   GET    /v1/records          200 { items, nextCursor }  (?acquired=, ?sort=name|price, ?limit=, ?cursor=)
//   POST   /v1/records          201 + the new wish          (Idempotency-Key)
//   GET    /v1/records/:id      200 + the wish
//   PUT    /v1/records/:id      200 + the replaced wish
//   PATCH  /v1/records/:id      200 + the changed wish      (the merged wish is validated)
//   DELETE /v1/records/:id      204, no body
// Every failure goes through toErrorResponse; every answer has an x-request-id header. A breaking change
// of this contract would go to /v2, next to /v1.
import { randomUUID } from "node:crypto";
import type http from "node:http";
import { ApiError, toErrorResponse } from "./api-errors.ts";
import { parseJson, readBodyText } from "./body.ts";
import type { WishRepository } from "./fileRepository.ts";
import type { Answer, IdempotencyStore } from "./idempotency.ts";
import { listWishes } from "./list.ts";
import { validateWishInput } from "./validate.ts";
import type { WishInput } from "./validate.ts";
import type { Wish } from "../../domain/wishes.ts";

export const API_MAX_BODY_BYTES = 4096;

// The next free id: one more than the biggest number among the ids "w-NN", with at least two digits.
function nextId(wishes: Wish[]): string {
  let biggest = 0;
  for (const wish of wishes) {
    const number = Number(wish.id.slice(2));
    if (wish.id.startsWith("w-") && Number.isInteger(number) && number > biggest) {
      biggest = number;
    }
  }
  return "w-" + String(biggest + 1).padStart(2, "0");
}

function validated(body: unknown): WishInput {
  const result = validateWishInput(body);
  if (!result.ok) {
    throw new ApiError(400, "VALIDATION_FAILED", result.errors);
  }
  return result.value;
}

async function collection(req: http.IncomingMessage, query: URLSearchParams, repository: WishRepository, idempotency: IdempotencyStore): Promise<Answer> {
  if (req.method === "GET") {
    const result = listWishes(await repository.list(), query);
    if (!result.ok) {
      throw new ApiError(400, "VALIDATION_FAILED", result.errors);
    }
    return { status: 200, body: { items: result.items, nextCursor: result.nextCursor } };
  }
  if (req.method === "POST") {
    // The body limit comes before anything else; Node gives header names in lower case.
    const text = await readBodyText(req, API_MAX_BODY_BYTES);
    const key = req.headers["idempotency-key"];
    return idempotency.run(typeof key === "string" ? key : undefined, text, async () => {
      const value = validated(parseJson(text));
      const wish: Wish = { id: nextId(await repository.list()), ...value };
      await repository.save(wish);
      return { status: 201, body: wish };
    });
  }
  throw new ApiError(405, "METHOD_NOT_ALLOWED", { method: req.method }, { allow: "GET, POST" });
}

async function oneRecord(req: http.IncomingMessage, id: string, repository: WishRepository): Promise<Answer> {
  const methods = ["GET", "PUT", "PATCH", "DELETE"];
  if (!methods.includes(req.method ?? "")) {
    throw new ApiError(405, "METHOD_NOT_ALLOWED", { method: req.method }, { allow: methods.join(", ") });
  }
  const text = req.method === "PUT" || req.method === "PATCH" ? await readBodyText(req, API_MAX_BODY_BYTES) : "";
  const current = await repository.get(id);
  if (current === null) {
    throw new ApiError(404, "NOT_FOUND", { id: id });
  }
  if (req.method === "GET") {
    return { status: 200, body: current };
  }
  if (req.method === "DELETE") {
    await repository.remove(id);
    return { status: 204, body: undefined };
  }
  // PUT replaces the whole wish; PATCH merges the sent fields into it and validates the result, so a
  // patch can never leave a wish that a create would refuse. The id comes from the path only.
  const { id: _storedId, ...fields } = current;
  const input = req.method === "PUT" ? parseJson(text) : { ...fields, ...(parseJson(text) as object) };
  const wish: Wish = { id: id, ...validated(input) };
  await repository.save(wish);
  return { status: 200, body: wish };
}

async function route(req: http.IncomingMessage, url: URL, repository: WishRepository, idempotency: IdempotencyStore): Promise<Answer> {
  const parts = url.pathname.split("/").filter((part) => part !== "");
  if (parts[0] === "v1" && parts[1] === "records") {
    if (parts.length === 2) {
      return collection(req, url.searchParams, repository, idempotency);
    }
    if (parts.length === 3) {
      let id: string;
      try {
        id = decodeURIComponent(parts[2]);
      } catch {
        throw new ApiError(400, "VALIDATION_FAILED", { id: "malformed" }); // a broken escape such as %E0
      }
      return oneRecord(req, id, repository);
    }
  }
  throw new ApiError(404, "NOT_FOUND", { path: url.pathname });
}

// Answers one request under /v1: the route's answer, or the error model for whatever it threw.
export async function handleV1(req: http.IncomingMessage, res: http.ServerResponse, url: URL, repository: WishRepository, idempotency: IdempotencyStore, sendJson: (res: http.ServerResponse, status: number, value: unknown) => void): Promise<void> {
  const requestId = randomUUID();
  res.setHeader("x-request-id", requestId);
  try {
    const answer = await route(req, url, repository, idempotency);
    if (answer.body === undefined) {
      res.statusCode = answer.status;
      res.end();
    } else {
      sendJson(res, answer.status, answer.body);
    }
  } catch (error) {
    const { status, headers, body } = toErrorResponse(error, requestId);
    if (status >= 500) {
      console.error(`[${requestId}]`, error);
    }
    for (const [name, value] of Object.entries(headers)) {
      res.setHeader(name, value);
    }
    sendJson(res, status, body);
  }
}
