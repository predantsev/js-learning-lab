// The starting records of the web project (data/expenses.json), read from the disk. The path is built from
// this file's folder, not from the working directory, so the script works from any folder. tsc cannot see
// what a JSON file holds: JSON.parse gives `unknown`, and parseExpenseList checks every record at run time —
// the same contract the web app uses for an API answer.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseExpenseList } from "../../data/model.ts";
import type { Expense } from "../../domain/expenses.ts";

export const FIXTURES_FILE = join(import.meta.dirname, "..", "..", "data", "expenses.json");

export async function loadFixtures(file: string = FIXTURES_FILE): Promise<Expense[]> {
  const body: unknown = JSON.parse(await readFile(file, "utf8"));
  if (typeof body !== "object" || body === null || !("schemaVersion" in body) || body.schemaVersion !== 1 || !("records" in body)) {
    throw new Error("the file is not { schemaVersion: 1, records }");
  }
  const parsed = parseExpenseList(body.records);
  if (!parsed.ok) {
    throw new Error(`invalid records: ${JSON.stringify(parsed.errors)}`);
  }
  return parsed.value;
}
