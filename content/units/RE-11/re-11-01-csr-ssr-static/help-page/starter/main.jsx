import { createRoot } from "react-dom/client";
import HelpPage from "./HelpPage";
import { helpProps } from "./help-data";

createRoot(document.getElementById("root")).render(<HelpPage {...helpProps} />);
