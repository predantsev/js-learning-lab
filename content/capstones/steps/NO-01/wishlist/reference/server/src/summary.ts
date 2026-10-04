// The wishlist summary in the terminal: `npm run summary` (or `node src/summary.ts`) in server/.
// It checks the configuration first and stops with exit code 1 when a value is invalid; a damaged or
// missing fixtures file also ends with a readable message and exit code 1, without a stack trace.
import { loadConfig } from "./config.ts";
import { loadFixtures, FIXTURES_FILE } from "./fixtures.ts";
import { formatPrice } from "./format.ts";
import { summarizeItems } from "../../domain/wishes.ts";
import type { Wish } from "../../domain/wishes.ts";

const TEXT = {
  uk: { count: "Бажань", wantedTotal: "Ще хочу на суму", withoutPrice: "Бажаних без ціни", cannotRead: "Не вдалося прочитати" },
  en: { count: "Wishes", wantedTotal: "Still wanted for", withoutPrice: "Wanted without a price", cannotRead: "Cannot read" },
};

// Returns the exit code: 0 when the summary was printed, 1 when it could not be.
async function main(): Promise<number> {
  const config = loadConfig(process.env);
  if (!config.ok) {
    for (const message of config.errors) {
      console.error(message);
    }
    return 1;
  }
  const { locale } = config.value;
  const text = TEXT[locale];

  // Only the loading is inside try: a mistake in the code below is not reported as a damaged file.
  let wishes: Wish[];
  try {
    wishes = await loadFixtures();
  } catch (error) {
    console.error(`${text.cannotRead} ${FIXTURES_FILE}: ${(error as Error).message}`);
    return 1;
  }

  const summary = summarizeItems(wishes);
  console.log(`${text.count}: ${summary.count}`);
  console.log(`${text.wantedTotal}: ${formatPrice(summary.wantedTotal, locale)}`);
  console.log(`${text.withoutPrice}: ${summary.wantedWithoutPrice}`);
  return 0;
}

// process.exitCode, not process.exit(): Node finishes writing the output first.
process.exitCode = await main();
