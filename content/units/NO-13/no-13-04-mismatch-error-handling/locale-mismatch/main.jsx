import { hydrateRoot } from "react-dom/client";
import Boundary from "./Boundary";
import ExpenseTotal from "./ExpenseTotal";

const root = document.getElementById("root");
const serverStrong = root.querySelector("strong");
console.log(`%%serverShows%%: ${serverStrong.textContent}`);

// The server formatted with its default locale; this browser formats with another one.
const browserLocale = "uk-UA";

hydrateRoot(
  root,
  <Boundary>
    <ExpenseTotal totalMinor={185590} locale={browserLocale} />
  </Boundary>,
  {
    onRecoverableError(error, errorInfo) {
      console.log(`onRecoverableError: ${error.message.split("\n")[0]}`);
      // Each stack line reads "at Name (…)"; keep only the names.
      const names = errorInfo.componentStack.trim().split("\n").map((line) => line.trim().split(" ")[1]);
      console.log(`componentStack: ${names.join(" ← ")}`);
    },
  },
);

setTimeout(() => {
  console.log(`%%nowShows%%: ${root.querySelector("strong").textContent}`);
  console.log(`%%sameNode%%: ${serverStrong === root.querySelector("strong")}`);
}, 300);
