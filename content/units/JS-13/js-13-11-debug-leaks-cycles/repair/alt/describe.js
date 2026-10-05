import { MAX_BYTES } from "./limits.js";

export const LIMIT_TEXT = "%%tooBig%%".replace("{max}", String(MAX_BYTES));
