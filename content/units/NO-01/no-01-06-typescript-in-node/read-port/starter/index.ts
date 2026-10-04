// Read-only driver: reads the port from three environments, as three terminal runs would.
import { readPort } from "./port.ts";
import type { Env } from "./port.ts";

const environments: Env[] = [{}, { PORT: "8080" }, { PORT: "abc" }];
for (const env of environments) {
  try {
    console.log(`PORT=${env.PORT ?? "(unset)"} → ${readPort(env)}`);
  } catch (error) {
    console.error(`PORT=${env.PORT} → ${(error as Error).name}: ${(error as Error).message}`);
  }
}
