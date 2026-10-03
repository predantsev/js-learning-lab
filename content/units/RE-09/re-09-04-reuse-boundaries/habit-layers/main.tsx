import { createRoot } from "react-dom/client";
import App from "./App";
import { runDomainTests, withoutBrowserStorage } from "./domainTests";

runDomainTests("%%web%%");
withoutBrowserStorage(() => runDomainTests("%%native%%"));

createRoot(document.getElementById("root")!).render(<App />);
