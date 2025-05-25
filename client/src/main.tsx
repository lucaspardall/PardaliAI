import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { loadIcons } from "./lib/utils/icons";

// Load Remix Icons
loadIcons();

createRoot(document.getElementById("root")!).render(<App />);
