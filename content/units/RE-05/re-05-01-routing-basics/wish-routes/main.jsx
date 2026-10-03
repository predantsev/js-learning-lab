import { createRoot } from "react-dom/client";
import App from "./App";

console.log("%%loaded%%"); // a module runs once per page load
createRoot(document.getElementById("root")).render(<App />);
