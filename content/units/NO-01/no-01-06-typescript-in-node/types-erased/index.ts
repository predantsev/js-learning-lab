// Node removes the types and runs what is left. Nothing here checks them.
import type { Config } from "./config.ts";
import { describeConfig } from "./config.ts";

// 1. A wrong literal in the code: tsc would report it, Node runs it anyway.
const fromCode: Config = { port: "3000", locale: "uk" };
console.log(`%%fromCode%%: ${describeConfig(fromCode)}`);

// 2. A wrong value from the environment: the types are fine, the value is not.
const env: Record<string, string | undefined> = { PORT: "abc" };
const fromEnv: Config = { port: Number(env.PORT), locale: "uk" };
console.log(`%%fromEnv%%: ${describeConfig(fromEnv)}`);
