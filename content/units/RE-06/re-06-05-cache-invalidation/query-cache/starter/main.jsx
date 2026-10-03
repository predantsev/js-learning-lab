import { createRoot } from "react-dom/client";
import "./fakeServer.js";
import App from "./App";

createRoot(document.getElementById("root")).render(<App />);
