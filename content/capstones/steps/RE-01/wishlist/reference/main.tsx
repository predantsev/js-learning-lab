// The entry of the project: it reads the wishes once and hands them to React. Reading the storage
// stays here, outside the components: a component only shows the data it receives.
import { createRoot } from "react-dom/client";
import { App } from "./ui/App.tsx";
import { loadItems } from "./storage/wishes.ts";
import type { Wish } from "./domain/wishes.ts";
import { loadFixtures } from "./data/fixtures.js";

// Saved wishes win; without them (or instead of damaged ones) the page shows the starting wishes
// from data/wishes.json. `await` at the top level of a module waits before the first render.
const saved = loadItems(localStorage);
const items: Wish[] = saved.ok ? saved.items : await loadFixtures();

createRoot(document.getElementById("root")!).render(<App items={items} />);
