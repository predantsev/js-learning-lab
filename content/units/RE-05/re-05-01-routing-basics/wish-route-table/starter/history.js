import { createMemoryHistory } from "./router";

// One history stack for the whole app; the page opens at /items.
export const history = createMemoryHistory("/items");
