// A review bench: runs the pull request's component the way the app would (with StrictMode, as
// the Vite template does) and prints evidence a reviewer can quote.
import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import PriceWatch, { sourceUrl } from "./PriceWatch";
import { priceFeed } from "./priceFeed.js";

const root = createRoot(document.getElementById("root"));
flushSync(() =>
  root.render(
    <StrictMode>
      <PriceWatch onClose={() => console.log("close")} />
    </StrictMode>,
  ),
);
await new Promise((resolve) => setTimeout(resolve, 50)); // let the effects run

// 1. Behavior: one price drop from the feed.
priceFeed.emit({ name: "%%headphones%%", price: 2499 });
await new Promise((resolve) => setTimeout(resolve, 50)); // let React show the new rows
console.log(`%%evRows%% ${document.querySelectorAll("li").length}`);

// 2. Accessibility: the name a screen reader announces for the icon button.
const button = document.querySelector("button");
const name = (button.getAttribute("aria-label") ?? button.textContent).trim();
console.log(`%%evName%% "${name}"`);

// 3. Bundle and env: what any visitor can read from the client code.
console.log(`%%evUrl%% ${sourceUrl}`);

// 4. Cleanup: subscriptions left after the component is gone.
flushSync(() => root.render(null));
console.log(`%%evListeners%% ${priceFeed.listenerCount()}`);
