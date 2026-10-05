import { createMemoryHistory } from "./router";

// One history stack for the whole app; the page opens at the catalog.
export const history = createMemoryHistory("/items");
