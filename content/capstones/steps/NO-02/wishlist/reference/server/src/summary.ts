// The wishlist summary in the terminal: `npm run summary` (or `node src/summary.ts`) in server/. It reads
// the stored wishes (server/data/wishlist.json; on the very first start the web project's starting
// wishes are stored there first). It checks the configuration first and stops with exit code 1 when a
// value is invalid; a damaged data file also ends with a readable message and exit code 1.
import { loadConfig } from "./config.ts";
import { formatPrice } from "./format.ts";
import { openRepository } from "./open.ts";
import { summarizeItems } from "../../domain/wishes.ts";
import type { Wish } from "../../domain/wishes.ts";

const TEXT = {
  uk: { count: "Бажань", wantedTotal: "Ще хочу на суму", withoutPrice: "Бажаних без ціни", cannotRead: "Не вдалося прочитати збережені бажання", removedTemp: "Видалено тимчасовий файл, що лишився після збою", seeded: "Створено файл даних зі стартовими бажаннями" },
  en: { count: "Wishes", wantedTotal: "Still wanted for", withoutPrice: "Wanted without a price", cannotRead: "Cannot read the stored wishes", removedTemp: "Removed a temp file left by a crash", seeded: "Created the data file with the starting wishes" },
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
    const opened = await openRepository(config.value);
    for (const name of opened.removedTemps) {
      console.log(`${text.removedTemp}: ${name}`);
    }
    if (opened.seeded) {
      console.log(`${text.seeded}: ${opened.repository.file}`);
    }
    wishes = await opened.repository.list();
  } catch (error) {
    console.error(`${text.cannotRead}: ${(error as Error).message}`);
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
