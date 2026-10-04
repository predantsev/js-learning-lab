// An answer that is not ok: `status` as in HTTP (400 a refused change, 404 an unknown id, 503 a failure).
// Both data sources (data/fixtureApi.ts, data/httpApi.ts) reject with it, so the screens need one check.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
