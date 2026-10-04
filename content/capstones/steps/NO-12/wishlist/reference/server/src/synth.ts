// Writes N synthetic wishes as JSON lines to the standard output: `npm run -s synth -- 10000 > data/import.jsonl`
// in server/. The wishes come from the web project's makeSyntheticWishes (the same count always gives the
// same list) with ids w-101, w-102, … that do not clash with the starting ones. The output is written with
// backpressure: when the terminal or the file cannot keep up, write() answers false and the script waits
// for 'drain' instead of piling the lines up in memory.
import { makeSyntheticWishes } from "../../data/synthetic.js";
import type { Wish } from "../../domain/wishes.ts";
import { wishLine, writeJsonLines } from "./jsonl.ts";

const count = Number(process.argv[2] ?? "10000");
if (!Number.isInteger(count) || count < 1 || count > 100_000) {
  console.error("Usage: npm run -s synth -- <count from 1 to 100000> > file.jsonl");
  process.exitCode = 1;
} else {
  const wishes: Wish[] = makeSyntheticWishes(count).map((wish: Wish, index: number) => ({ ...wish, id: `w-${101 + index}` }));
  await writeJsonLines(wishes.map(wishLine), process.stdout);
}
