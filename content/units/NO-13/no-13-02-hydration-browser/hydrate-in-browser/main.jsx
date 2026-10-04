import { hydrateRoot } from "react-dom/client";
import WishList from "./WishList";

const firstButton = document.querySelector("#root button");

// Before hydration: the button is in the page, but nothing listens to it.
firstButton.click();
console.log(`%%beforeHydration%%: ${firstButton.textContent}`);

// The client entry: the same component with the same initial data as the server.
const data = JSON.parse(document.getElementById("initial-data").textContent);
hydrateRoot(document.getElementById("root"), <WishList {...data} />);

setTimeout(() => {
  firstButton.click();
  setTimeout(() => {
    console.log(`%%afterHydration%%: ${firstButton.textContent}`);
    console.log(`%%sameNode%%: ${firstButton === document.querySelector("#root button")}`);
  }, 100);
}, 300);
